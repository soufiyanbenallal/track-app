#!/bin/bash

echo "🚀 Testing app startup..."

# Check if the app exists
if [ ! -d "release/mac-arm64/Track App.app" ]; then
    echo "❌ App not found. Please run ./test-dependencies.sh first"
    exit 1
fi

echo "📱 Starting Track App..."
echo "⚠️  Note: You may see a security warning about unidentified developer"
echo "   Right-click the app and select 'Open' to bypass this"

# Start the app in background and capture any immediate errors
open "release/mac-arm64/Track App.app" 2>&1 &
APP_PID=$!

echo "⏳ App started with PID: $APP_PID"
echo "🔍 Check the app for any error dialogs or console errors"
echo "📋 If you see any errors, please share them"

# Wait a moment and check if the process is still running
sleep 3
if ps -p $APP_PID > /dev/null 2>&1; then
    echo "✅ App process is still running"
else
    echo "❌ App process may have crashed"
fi

echo "🎯 Test completed. Check the app interface for functionality." 