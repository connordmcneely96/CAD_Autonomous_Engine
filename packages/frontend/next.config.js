const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['three'],
  // Force dynamic rendering - no static optimization
  output: 'standalone',
  // Allow build to succeed even without Clerk keys
  experimental: {
    missingSuspenseWithCSRBailout: false,
    outputFileTracingIncludes: {
      '/': ['./node_modules/**/*.wasm', './node_modules/**/*.node'],
    },
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
  typescript: {
    ignoreBuildErrors: false, // Re-enable TypeScript checking
  },
  webpack: (config, { isServer }) => {
    // Add @ alias resolution for webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    // External dependencies
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      bufferutil: 'commonjs bufferutil',
    });

    return config;
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_CAD_ENGINE_URL: process.env.NEXT_PUBLIC_CAD_ENGINE_URL || 'http://localhost:8000',
    NEXT_PUBLIC_AI_SERVICE_URL:
      process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001',
    // Clerk keys MUST be set in Vercel environment variables
    // Use simple fake keys for fallback: pk_test_BUILD_ONLY and sk_test_BUILD_ONLY
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_BUILD_ONLY',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'sk_test_BUILD_ONLY',
  },
};

module.exports = nextConfig;
