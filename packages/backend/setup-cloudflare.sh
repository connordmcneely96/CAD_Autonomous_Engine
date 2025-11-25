#!/bin/bash
set -e

echo "=========================================="
echo "Cloudflare Infrastructure Setup"
echo "=========================================="
echo ""

# Set API token
export CLOUDFLARE_API_TOKEN="CQGMJ0vuEegeQ5VEUi0yvtX9PngU88pI1zj9x6eU"

echo "Step 1: Verify Wrangler authentication..."
if ! wrangler whoami 2>/dev/null; then
  echo "❌ Wrangler authentication failed"
  echo "Please run: wrangler login"
  echo "Or verify your API token is correct"
  exit 1
fi
echo "✅ Wrangler authenticated"
echo ""

echo "Step 2: Create D1 database..."
echo "Creating database: cad-engine-db"
DB_OUTPUT=$(wrangler d1 create cad-engine-db 2>&1)
echo "$DB_OUTPUT"

# Extract database ID from output
DATABASE_ID=$(echo "$DB_OUTPUT" | grep "database_id" | cut -d'"' -f4)

if [ -z "$DATABASE_ID" ]; then
  echo "⚠️  Could not extract database ID. It may already exist."
  echo "Run: wrangler d1 list"
  echo "And update wrangler.toml manually"
else
  echo "✅ Database created with ID: $DATABASE_ID"
  
  # Update wrangler.toml with the database ID
  sed -i "s/YOUR_DATABASE_ID_HERE/$DATABASE_ID/g" wrangler.toml
  echo "✅ Updated wrangler.toml with database ID"
fi
echo ""

echo "Step 3: Apply database schema..."
if [ -f "schema.sql" ]; then
  wrangler d1 execute cad-engine-db --file=./schema.sql
  echo "✅ Database schema applied"
else
  echo "❌ schema.sql not found"
  exit 1
fi
echo ""

echo "Step 4: Verify database tables..."
wrangler d1 execute cad-engine-db --command "SELECT name FROM sqlite_master WHERE type='table'"
echo ""

echo "Step 5: Create R2 bucket..."
if wrangler r2 bucket create cad-engine-files 2>&1 | grep -q "Created"; then
  echo "✅ R2 bucket created: cad-engine-files"
else
  echo "⚠️  Bucket may already exist or creation failed"
  wrangler r2 bucket list
fi
echo ""

echo "Step 6: Set Clerk secret..."
echo "sk_test_TI9n5a3MiwoFkUYCTbrGm6yhw85ly2Hwz2GDIu2C2d" | wrangler secret put CLERK_SECRET_KEY
echo "✅ Clerk secret configured"
echo ""

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Resources created:"
echo "- D1 Database: cad-engine-db"
echo "- R2 Bucket: cad-engine-files"
echo "- Clerk authentication configured"
echo ""
echo "Next steps:"
echo "1. Verify wrangler.toml has correct database_id"
echo "2. Test locally: wrangler dev"
echo "3. Deploy: wrangler deploy"
echo ""
