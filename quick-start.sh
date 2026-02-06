#!/bin/bash

# Ross Tax Prep - Quick Start Script
# This script helps set up the development environment

set -e

echo "🚀 Ross Tax Prep - Quick Start"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if wrangler is installed globally
if ! command -v wrangler &> /dev/null; then
    echo ""
    echo "⚠️  Wrangler CLI is not installed globally."
    echo "   You can install it with: npm install -g wrangler"
    echo "   Or use npx: npx wrangler <command>"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Read SETUP.md for complete configuration"
echo "  2. Login to Cloudflare: wrangler login"
echo "  3. Create D1 database: wrangler d1 create ross-tax-prep-db"
echo "  4. Update wrangler.toml with database ID"
echo "  5. Run migrations: wrangler d1 execute ross-tax-prep-db --file=./database/migrations/001_initial_schema.sql"
echo "  6. Create KV namespaces and R2 buckets (see SETUP.md)"
echo "  7. Set secrets: wrangler secret put JWT_SECRET"
echo ""
echo "Development:"
echo "  - Frontend only: npm run dev"
echo "  - Full stack with API: npm run pages:dev"
echo ""
echo "📚 Documentation:"
echo "  - SETUP.md - Complete setup guide"
echo "  - API.md - API documentation"
echo "  - database/README.md - Database setup"
echo "  - .env.example - Environment variables"
echo ""
