#!/bin/bash

echo "📊 Build Status Check"
echo "===================="

# Check if critical dependencies are installed
echo "🔍 Checking dependencies..."
if [ -d "node_modules/whatwg-url" ]; then
    echo "✅ whatwg-url installed"
else
    echo "❌ whatwg-url missing"
fi

if [ -d "node_modules/node-fetch" ]; then
    echo "✅ node-fetch installed"
else
    echo "❌ node-fetch missing"
fi

if [ -d "node_modules/@notionhq/client" ]; then
    echo "✅ @notionhq/client installed"
else
    echo "❌ @notionhq/client missing"
fi

# Check if build files exist
echo ""
echo "🔍 Checking build files..."
if [ -f "dist/main.js" ]; then
    echo "✅ main.js built"
else
    echo "❌ main.js missing"
fi

if [ -f "dist/renderer/index.html" ]; then
    echo "✅ renderer/index.html built"
else
    echo "❌ renderer/index.html missing"
fi

# Check package.json configuration
echo ""
echo "🔍 Checking package.json configuration..."
if grep -q "whatwg-url" package.json; then
    echo "✅ whatwg-url in dependencies"
else
    echo "❌ whatwg-url missing from dependencies"
fi

if grep -q "extraResources" package.json; then
    echo "✅ extraResources configured"
else
    echo "❌ extraResources not configured"
fi

# Show current environment
echo ""
echo "🔍 Environment info..."
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"
echo "Current directory: $(pwd)"

echo ""
echo "📋 Quick Actions:"
echo "  ./quick-test.sh    - Quick production test"
echo "  ./test-prod.sh     - Full production test (with clean)"
echo "  ./debug-prod.sh    - Debug production build"
echo "  pnpm run dev       - Development mode"
echo "  pnpm run dist:mac  - Create distributable" 