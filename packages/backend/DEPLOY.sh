#!/bin/bash

# =============================================================================
# Cloudflare Workers Deployment Script
# =============================================================================
# This script deploys the CAD Engine backend to Cloudflare Workers
#
# Prerequisites:
# - Cloudflare account
# - wrangler CLI installed (npm install -g wrangler)
# - Valid Cloudflare API token or authenticated via: wrangler login
#
# Usage:
#   chmod +x DEPLOY.sh
#   ./DEPLOY.sh
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Clerk credentials
CLERK_SECRET_KEY="sk_test_TI9n5a3MiwoFkUYCTbrGm6yhw85ly2Hwz2GDIu2C2d"

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}CAD Engine Backend - Cloudflare Deployment${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""

# Step 1: Verify authentication
echo -e "${YELLOW}Step 1: Verifying Cloudflare authentication...${NC}"
if ! wrangler whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ Not authenticated with Cloudflare${NC}"
    echo -e "${YELLOW}Please run: wrangler login${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Authenticated${NC}"
echo ""

# Step 2: Create D1 Database
echo -e "${YELLOW}Step 2: Creating D1 database...${NC}"
if wrangler d1 list 2>/dev/null | grep -q "cad-engine-db"; then
    echo -e "${GREEN}✅ Database 'cad-engine-db' already exists${NC}"
else
    echo -e "Creating new D1 database..."
    DB_OUTPUT=$(wrangler d1 create cad-engine-db)
    echo "$DB_OUTPUT"

    # Extract database_id from output
    DB_ID=$(echo "$DB_OUTPUT" | grep "database_id" | awk -F'"' '{print $2}')

    if [ -z "$DB_ID" ]; then
        echo -e "${RED}❌ Failed to create database${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Database created with ID: $DB_ID${NC}"

    # Update wrangler.toml
    echo -e "${YELLOW}Updating wrangler.toml with database ID...${NC}"
    sed -i "s/database_id = \"YOUR_DATABASE_ID_HERE\"/database_id = \"$DB_ID\"/" wrangler.toml
    echo -e "${GREEN}✅ wrangler.toml updated${NC}"
fi
echo ""

# Step 3: Apply database schema
echo -e "${YELLOW}Step 3: Applying database schema...${NC}"
if wrangler d1 execute cad-engine-db --file=./schema.sql; then
    echo -e "${GREEN}✅ Schema applied successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Schema may already be applied (this is OK)${NC}"
fi
echo ""

# Step 4: Create R2 Bucket
echo -e "${YELLOW}Step 4: Creating R2 bucket...${NC}"
if wrangler r2 bucket list 2>/dev/null | grep -q "cad-engine-files"; then
    echo -e "${GREEN}✅ Bucket 'cad-engine-files' already exists${NC}"
else
    if wrangler r2 bucket create cad-engine-files; then
        echo -e "${GREEN}✅ R2 bucket created${NC}"
    else
        echo -e "${RED}❌ Failed to create R2 bucket${NC}"
        exit 1
    fi
fi
echo ""

# Step 5: Set Clerk secret
echo -e "${YELLOW}Step 5: Setting Clerk secret key...${NC}"
if echo "$CLERK_SECRET_KEY" | wrangler secret put CLERK_SECRET_KEY; then
    echo -e "${GREEN}✅ Clerk secret set${NC}"
else
    echo -e "${RED}❌ Failed to set Clerk secret${NC}"
    exit 1
fi
echo ""

# Step 6: Deploy Worker
echo -e "${YELLOW}Step 6: Deploying Worker to Cloudflare...${NC}"
if wrangler deploy; then
    echo -e "${GREEN}✅ Worker deployed successfully!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
echo ""

# Step 7: Get Worker URL
echo -e "${YELLOW}Step 7: Getting Worker URL...${NC}"
WORKER_URL=$(wrangler deployments list --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$WORKER_URL" ]; then
    echo -e "${YELLOW}⚠️  Could not automatically detect Worker URL${NC}"
    echo -e "Check your Cloudflare dashboard: https://dash.cloudflare.com/"
else
    echo -e "${GREEN}✅ Worker deployed at: $WORKER_URL${NC}"
fi
echo ""

# Step 8: Test endpoints
echo -e "${YELLOW}Step 8: Testing deployed endpoints...${NC}"
if [ ! -z "$WORKER_URL" ]; then
    echo -e "Testing health endpoint..."
    if curl -s "$WORKER_URL/health" | grep -q "ok"; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check returned unexpected response${NC}"
    fi

    echo -e "Testing database endpoint..."
    if curl -s "$WORKER_URL/test-db" | grep -q "success"; then
        echo -e "${GREEN}✅ Database connection working${NC}"
    else
        echo -e "${YELLOW}⚠️  Database test returned unexpected response${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping tests - Worker URL not available${NC}"
fi
echo ""

# Final instructions
echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Add Worker URL to Vercel environment variables:"
echo -e "   ${YELLOW}NEXT_PUBLIC_API_URL=$WORKER_URL${NC}"
echo -e ""
echo -e "2. Update backend CORS with your Vercel URL:"
echo -e "   Edit ${YELLOW}src/index.ts${NC} line 29"
echo -e ""
echo -e "3. Redeploy frontend to Vercel"
echo -e ""
echo -e "4. Test end-to-end authentication"
echo -e ""
echo -e "For more details, see: ${YELLOW}CLOUDFLARE_SETUP_MANUAL.md${NC}"
echo ""
