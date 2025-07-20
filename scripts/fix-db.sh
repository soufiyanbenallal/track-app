#!/bin/bash

echo "🔧 Fixing Database Foreign Key Constraints"
echo "=========================================="

DB_PATH="$HOME/.trackapp/trackapp.db"

# Enable foreign keys
sqlite3 "$DB_PATH" "PRAGMA foreign_keys = ON;"

# Drop and recreate tasks table with correct foreign key
echo "🔄 Recreating tasks table..."
sqlite3 "$DB_PATH" "DROP TABLE IF EXISTS tasks;"

sqlite3 "$DB_PATH" "
CREATE TABLE tasks (
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
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);
"

# Recreate indexes
echo "📊 Recreating indexes..."
sqlite3 "$DB_PATH" "
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON tasks (start_time);
CREATE INDEX IF NOT EXISTS idx_tasks_is_paid ON tasks (is_paid);
CREATE INDEX IF NOT EXISTS idx_tasks_is_archived ON tasks (is_archived);
"

echo "✅ Database fixed!" 