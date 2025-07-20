#!/bin/bash

echo "🧪 Testing Task Creation"
echo "========================"

DB_PATH="$HOME/.trackapp/trackapp.db"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found"
    exit 1
fi

echo "✅ Database found"

# Get available projects
echo "📁 Available projects:"
sqlite3 "$DB_PATH" "SELECT id, name FROM projects;"

# Get project count
PROJECT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM projects;")
echo "  Total projects: $PROJECT_COUNT"

if [ "$PROJECT_COUNT" -eq 0 ]; then
    echo "❌ No projects found. Please create a project first."
    exit 1
fi

# Get first project ID
FIRST_PROJECT_ID=$(sqlite3 "$DB_PATH" "SELECT id FROM projects LIMIT 1;")
echo "  Using project ID: $FIRST_PROJECT_ID"

# Test task creation
echo ""
echo "📋 Testing task creation..."

# Create a test task
sqlite3 "$DB_PATH" "INSERT INTO tasks (project_id, description, start_time, is_paid, is_archived) VALUES ($FIRST_PROJECT_ID, 'Test Task from Script', datetime('now'), 0, 0);"

# Get the created task
TASK_ID=$(sqlite3 "$DB_PATH" "SELECT id FROM tasks WHERE description = 'Test Task from Script' ORDER BY id DESC LIMIT 1;")
echo "  Created task with ID: $TASK_ID"

# Verify the task was created
if [ -n "$TASK_ID" ]; then
    echo "  ✅ Task creation successful"
    
    # Show task details
    echo "  Task details:"
    sqlite3 "$DB_PATH" "SELECT id, project_id, description, start_time FROM tasks WHERE id = $TASK_ID;"
    
    # Clean up
    echo ""
    echo "🧹 Cleaning up test task..."
    sqlite3 "$DB_PATH" "DELETE FROM tasks WHERE id = $TASK_ID;"
    echo "  ✅ Test task deleted"
else
    echo "  ❌ Task creation failed"
fi

echo ""
echo "🎉 Task creation test complete!" 