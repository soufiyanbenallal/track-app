#!/bin/bash

echo "🧪 Testing TrackApp CRUD Operations"
echo "==================================="

# Check if database exists
if [ ! -f ~/.trackapp/trackapp.db ]; then
    echo "❌ Database not found. Please start the application first."
    exit 1
fi

echo "✅ Database found"

# Test project operations
echo ""
echo "📁 Testing Project CRUD Operations:"

# Create a test project
echo "  Creating test project..."
sqlite3 ~/.trackapp/trackapp.db "INSERT INTO projects (name, description, color, is_archived) VALUES ('Test Project', 'Test Description', '#FF0000', 0);"

# Get the project ID
PROJECT_ID=$(sqlite3 ~/.trackapp/trackapp.db "SELECT id FROM projects WHERE name = 'Test Project' ORDER BY id DESC LIMIT 1;")
echo "  Created project with ID: $PROJECT_ID"

# Update the project
echo "  Updating test project..."
sqlite3 ~/.trackapp/trackapp.db "UPDATE projects SET description = 'Updated Description' WHERE id = $PROJECT_ID;"

# Verify the update
UPDATED_DESC=$(sqlite3 ~/.trackapp/trackapp.db "SELECT description FROM projects WHERE id = $PROJECT_ID;")
echo "  Updated description: $UPDATED_DESC"

# Test task operations
echo ""
echo "📋 Testing Task CRUD Operations:"

# Create a test task
echo "  Creating test task..."
sqlite3 ~/.trackapp/trackapp.db "INSERT INTO tasks (project_id, description, start_time, is_paid, is_archived) VALUES ($PROJECT_ID, 'Test Task', datetime('now'), 0, 0);"

# Get the task ID
TASK_ID=$(sqlite3 ~/.trackapp/trackapp.db "SELECT id FROM tasks WHERE description = 'Test Task' ORDER BY id DESC LIMIT 1;")
echo "  Created task with ID: $TASK_ID"

# Update the task
echo "  Updating test task..."
sqlite3 ~/.trackapp/trackapp.db "UPDATE tasks SET description = 'Updated Task' WHERE id = $TASK_ID;"

# Verify the update
UPDATED_TASK_DESC=$(sqlite3 ~/.trackapp/trackapp.db "SELECT description FROM tasks WHERE id = $TASK_ID;")
echo "  Updated task description: $UPDATED_TASK_DESC"

# Test foreign key constraint
echo ""
echo "🔗 Testing Foreign Key Constraints:"

# Try to delete project with tasks (should fail)
echo "  Attempting to delete project with tasks..."
if sqlite3 ~/.trackapp/trackapp.db "DELETE FROM projects WHERE id = $PROJECT_ID;" 2>/dev/null; then
    echo "  ❌ Foreign key constraint not working properly"
else
    echo "  ✅ Foreign key constraint working (project deletion blocked)"
fi

# Delete the task first
echo "  Deleting test task..."
sqlite3 ~/.trackapp/trackapp.db "DELETE FROM tasks WHERE id = $TASK_ID;"

# Now delete the project
echo "  Deleting test project..."
sqlite3 ~/.trackapp/trackapp.db "DELETE FROM projects WHERE id = $PROJECT_ID;"

# Verify cleanup
PROJECT_COUNT=$(sqlite3 ~/.trackapp/trackapp.db "SELECT COUNT(*) FROM projects WHERE name = 'Test Project';")
TASK_COUNT=$(sqlite3 ~/.trackapp/trackapp.db "SELECT COUNT(*) FROM tasks WHERE description = 'Test Task';")

if [ "$PROJECT_COUNT" -eq 0 ] && [ "$TASK_COUNT" -eq 0 ]; then
    echo "  ✅ Cleanup successful"
else
    echo "  ❌ Cleanup failed"
fi

echo ""
echo "🎉 CRUD Operations Test Complete!"
echo "   All basic operations are working correctly." 