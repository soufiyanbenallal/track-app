#!/bin/bash

echo "🔍 TrackApp Status Check"
echo "========================"

# Check if processes are running
echo "📊 Process Status:"
if pgrep -f "electron" > /dev/null; then
    echo "  ✅ Electron main process: RUNNING"
else
    echo "  ❌ Electron main process: NOT RUNNING"
fi

if pgrep -f "vite" > /dev/null; then
    echo "  ✅ Vite dev server: RUNNING"
else
    echo "  ❌ Vite dev server: NOT RUNNING"
fi

# Check if Vite server is responding
echo ""
echo "🌐 Server Status:"
if curl -s http://localhost:3000 > /dev/null; then
    echo "  ✅ Vite server responding on port 3000"
else
    echo "  ❌ Vite server not responding on port 3000"
fi

# Check database
echo ""
echo "🗄️  Database Status:"
if [ -f ~/.trackapp/trackapp.db ]; then
    echo "  ✅ Database file exists"
    PROJECT_COUNT=$(sqlite3 ~/.trackapp/trackapp.db "SELECT COUNT(*) FROM projects;" 2>/dev/null || echo "0")
    TASK_COUNT=$(sqlite3 ~/.trackapp/trackapp.db "SELECT COUNT(*) FROM tasks;" 2>/dev/null || echo "0")
    echo "  📊 Projects: $PROJECT_COUNT"
    echo "  📊 Tasks: $TASK_COUNT"
else
    echo "  ❌ Database file not found"
fi

echo ""
echo "🎯 Application should be ready to use!"
echo "   Open the Electron window to access the interface." 