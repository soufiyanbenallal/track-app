#!/bin/bash

echo "🔍 Testing dependency inclusion in built app..."

# Check if the app was built
if [ ! -d "release/mac-arm64/Track App.app" ]; then
    echo "❌ App not found. Building first..."
    pnpm run dist:mac:unsigned
fi

# Check for webidl-conversions
if find "release/mac-arm64/Track App.app" -name "webidl-conversions" -type d | grep -q "webidl-conversions"; then
    echo "✅ webidl-conversions found in built app"
else
    echo "❌ webidl-conversions NOT found in built app"
fi

# Check for whatwg-url
if find "release/mac-arm64/Track App.app" -name "whatwg-url" -type d | grep -q "whatwg-url"; then
    echo "✅ whatwg-url found in built app"
else
    echo "❌ whatwg-url NOT found in built app"
fi

# Check for node-fetch
if find "release/mac-arm64/Track App.app" -name "node-fetch" -type d | grep -q "node-fetch"; then
    echo "✅ node-fetch found in built app"
else
    echo "❌ node-fetch NOT found in built app"
fi

echo "📦 App size:"
du -sh "release/mac-arm64/Track App.app"

echo "🎯 Ready for testing!" 