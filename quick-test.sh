#!/bin/bash

echo "⚡ Quick Production Test"
echo "======================="

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
echo "Press Ctrl+C to stop the test"
echo ""
NODE_ENV=production npx electron . 