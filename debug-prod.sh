#!/bin/bash

echo "🔍 Production Build Debug Script"
echo "================================"

# Function to check if a module exists in node_modules
check_module() {
    local module=$1
    if [ -d "node_modules/$module" ]; then
        echo "✅ $module found"
        return 0
    else
        echo "❌ $module missing"
        return 1
    fi
}

# Function to check if a file exists in dist
check_dist_file() {
    local file=$1
    if [ -f "dist/$file" ]; then
        echo "✅ $file found in dist"
        return 0
    else
        echo "❌ $file missing from dist"
        return 1
    fi
}

echo "🔍 Checking critical dependencies..."
check_module "whatwg-url"
check_module "node-fetch"
check_module "@notionhq/client"
# Removed SQLite dependency - now using electron-store for NoSQL storage

echo ""
echo "🔍 Checking build output..."
check_dist_file "main.js"
check_dist_file "renderer/index.html"

echo ""
echo "🔍 Checking for common issues..."

# Check if electron-builder is properly configured
if grep -q "whatwg-url" package.json; then
    echo "✅ whatwg-url dependency found in package.json"
else
    echo "❌ whatwg-url dependency missing from package.json"
fi

# Check if the build script includes all necessary files
if grep -q "extraResources" package.json; then
    echo "✅ extraResources configured in package.json"
else
    echo "❌ extraResources not configured in package.json"
fi

echo ""
echo "🔧 Running production test..."
echo "============================="

# Clean and rebuild
echo "🧹 Cleaning previous builds..."
rm -rf dist release

echo "🔨 Building the app..."
pnpm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Testing production build..."
    echo "Press Ctrl+C to stop the test"
    echo ""
    NODE_ENV=production npx electron .
else
    echo "❌ Build failed!"
    exit 1
fi 