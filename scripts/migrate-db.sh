#!/bin/bash

echo "🔄 Migrating TrackApp Database"
echo "=============================="

DB_PATH="$HOME/.trackapp/trackapp.db"

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at $DB_PATH"
    exit 1
fi

echo "✅ Database found"

# Enable foreign key constraints
echo "🔗 Enabling foreign key constraints..."
sqlite3 "$DB_PATH" "PRAGMA foreign_keys = ON;"

# Check if foreign keys are enabled
FK_STATUS=$(sqlite3 "$DB_PATH" "PRAGMA foreign_keys;")
echo "  Foreign key status: $FK_STATUS"

# Recreate tables with proper foreign key constraints
echo "🏗️  Recreating tables with proper constraints..."

# Create temporary tables
sqlite3 "$DB_PATH" "
CREATE TABLE IF NOT EXISTS projects_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  notion_id TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"

sqlite3 "$DB_PATH" "
CREATE TABLE IF NOT EXISTS tasks_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  duration INTEGER,
  is_paid BOOLEAN DEFAULT FALSE,
  tags TEXT,
  notion_id TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects_new (id) ON DELETE CASCADE
);
"

# Copy data from old tables to new tables
echo "📋 Migrating data..."
sqlite3 "$DB_PATH" "INSERT INTO projects_new SELECT * FROM projects;"
sqlite3 "$DB_PATH" "INSERT INTO tasks_new SELECT * FROM tasks;"

# Drop old tables and rename new ones
echo "🔄 Replacing tables..."
sqlite3 "$DB_PATH" "DROP TABLE tasks;"
sqlite3 "$DB_PATH" "DROP TABLE projects;"
sqlite3 "$DB_PATH" "ALTER TABLE projects_new RENAME TO projects;"
sqlite3 "$DB_PATH" "ALTER TABLE tasks_new RENAME TO tasks;"

# Recreate indexes
echo "📊 Recreating indexes..."
sqlite3 "$DB_PATH" "
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON tasks (start_time);
CREATE INDEX IF NOT EXISTS idx_tasks_is_paid ON tasks (is_paid);
CREATE INDEX IF NOT EXISTS idx_tasks_is_archived ON tasks (is_archived);
"

# Test foreign key constraint
echo "🧪 Testing foreign key constraint..."
PROJECT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM projects;")
TASK_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM tasks;")

echo "  Projects: $PROJECT_COUNT"
echo "  Tasks: $TASK_COUNT"

# Try to delete a project with tasks (should fail)
if [ "$TASK_COUNT" -gt 0 ]; then
    FIRST_PROJECT=$(sqlite3 "$DB_PATH" "SELECT id FROM projects LIMIT 1;")
    if sqlite3 "$DB_PATH" "DELETE FROM projects WHERE id = $FIRST_PROJECT;" 2>/dev/null; then
        echo "  ❌ Foreign key constraint still not working"
    else
        echo "  ✅ Foreign key constraint working properly"
    fi
else
    echo "  ⚠️  No tasks found to test foreign key constraint"
fi

echo ""
echo "🎉 Database migration complete!"