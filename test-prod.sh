#!/bin/bash

echo "🧪 Testing Production Build"
echo "=========================="

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist release

# Build the app
echo "🔨 Building the app..."
pnpm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Test the production build directly with Electron
echo "🚀 Testing production build with Electron..."
NODE_ENV=production npx electron .

echo "✅ Production test completed!" 