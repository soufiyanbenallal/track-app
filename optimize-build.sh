#!/bin/bash

echo "🧹 Cleaning previous builds..."
rm -rf dist release

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building optimized app..."
pnpm run build

echo "📱 Creating distribution..."
pnpm run dist:mac:dir

echo "📊 Checking app size..."
if [ -d "release/mac" ]; then
    echo "App size:"
    du -sh release/mac/*
    echo ""
    echo "Detailed breakdown:"
    find release/mac -type f -exec du -h {} + | sort -hr | head -10
else
    echo "❌ Build failed or release directory not found"
    exit 1
fi

echo "✅ Build optimization complete!" 