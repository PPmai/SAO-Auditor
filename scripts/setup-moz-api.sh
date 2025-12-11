#!/bin/bash
# Setup script for Moz API token
# This script helps you add your Moz API token to .env

echo "🔧 Moz API Setup Script"
echo "======================"
echo ""
echo "To get your Moz API token:"
echo "1. Visit: https://moz.com/products/api"
echo "2. Sign up for a free account (requires credit card, but won't be charged)"
echo "3. Get your API token from the dashboard"
echo ""
read -p "Enter your Moz API token (or press Enter to skip): " moz_token

if [ -z "$moz_token" ]; then
    echo "⚠️  No token provided. Skipping..."
    echo ""
    echo "To add it manually, edit .env and add:"
    echo "MOZ_API_TOKEN=your_token_here"
    exit 0
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating it..."
    touch .env
fi

# Check if MOZ_API_TOKEN already exists
if grep -q "MOZ_API_TOKEN" .env; then
    echo "⚠️  MOZ_API_TOKEN already exists in .env"
    read -p "Do you want to replace it? (y/n): " replace
    if [ "$replace" = "y" ]; then
        # Remove old token line
        sed -i.bak '/^MOZ_API_TOKEN=/d' .env
        echo "MOZ_API_TOKEN=$moz_token" >> .env
        echo "✅ Moz API token updated in .env"
    else
        echo "⚠️  Keeping existing token"
    fi
else
    # Add new token
    echo "" >> .env
    echo "# Moz API (Free Tier - 2,500 calls/month)" >> .env
    echo "MOZ_API_TOKEN=$moz_token" >> .env
    echo "✅ Moz API token added to .env"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Test the integration:"
echo "  npx ts-node --compiler-options '{\"module\":\"commonjs\"}' scripts/test-all-features.ts"
echo ""

