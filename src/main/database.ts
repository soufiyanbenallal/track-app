import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export interface Project {
  id?: number;
  name: string;
  description?: string;
  color?: string;
  notion_id?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id?: number;
  project_id: number;
  description: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  is_paid: boolean;
  tags?: string;
  notion_id?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  project_id?: number;
  is_paid?: boolean;
  start_date?: string;
  end_date?: string;
  search?: string;
  is_archived?: boolean;
}

export interface ReportData {
  total_hours: number;
  paid_hours: number;
  unpaid_hours: number;
  tasks_count: number;
  projects_summary: Array<{
    project_name: string;
    hours: number;
    tasks_count: number;
  }>;
  daily_summary: Array<{
    date: string;
    hours: number;
    tasks_count: number;
  }>;
}

export class DatabaseManager {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(process.env.APPDATA || process.env.HOME || '', '.trackapp', 'trackapp.db');
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    
    // Enable foreign key constraints
    this.db.exec('PRAGMA foreign_keys = ON;');
    
    this.initializeTables();
  }

  private initializeTables(): void {
    // Projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        notion_id TEXT,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
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
        FOREIGN KEY (project_id) REFERENCES projects (id)
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks (project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON tasks (start_time);
      CREATE INDEX IF NOT EXISTS idx_tasks_is_paid ON tasks (is_paid);
      CREATE INDEX IF NOT EXISTS idx_tasks_is_archived ON tasks (is_archived);
    `);
  }

  // Project operations
  getProjects(): Project[] {
    const stmt = this.db.prepare(`
      SELECT * FROM projects 
      WHERE is_archived = FALSE 
      ORDER BY name
    `);
    return stmt.all() as Project[];
  }

  getAllProjects(): Project[] {
    const stmt = this.db.prepare(`
      SELECT * FROM projects 
      ORDER BY name
    `);
    return stmt.all() as Project[];
  }

  getArchivedProjects(): Project[] {
    const stmt = this.db.prepare(`
      SELECT * FROM projects 
      WHERE is_archived = TRUE 
      ORDER BY name
    `);
    return stmt.all() as Project[];
  }

  createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO projects (name, description, color, notion_id, is_archived)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        project.name,
        project.description,
        project.color,
        project.notion_id,
        project.is_archived ? 1 : 0
      );

      return this.getProjectById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  updateProject(project: Project): Project {
    try {
      const stmt = this.db.prepare(`
        UPDATE projects 
        SET name = ?, description = ?, color = ?, notion_id = ?, is_archived = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(
        project.name,
        project.description,
        project.color,
        project.notion_id,
        project.is_archived ? 1 : 0,
        project.id
      );

      return this.getProjectById(project.id!);
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }
  }

  deleteProject(id: number): void {
    try {
      // Check if project has associated tasks
      const taskCountStmt = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?');
      const taskCount = taskCountStmt.get(id) as { count: number };
      
      if (taskCount.count > 0) {
        // If foreign key constraints are not enforced, we need to handle this manually
        throw new Error(`Cannot delete project: ${taskCount.count} task(s) are associated with this project. Please delete or reassign the tasks first.`);
      }
      
      const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Project not found');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  deleteProjectWithTasks(id: number): void {
    try {
      // Delete all tasks associated with the project first
      const deleteTasksStmt = this.db.prepare('DELETE FROM tasks WHERE project_id = ?');
      const taskResult = deleteTasksStmt.run(id);
      
      // Then delete the project
      const deleteProjectStmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
      const projectResult = deleteProjectStmt.run(id);
      
      if (projectResult.changes === 0) {
        throw new Error('Project not found');
      }
      
      console.log(`Deleted project ${id} and ${taskResult.changes} associated tasks`);
    } catch (error) {
      console.error('Error deleting project with tasks:', error);
      throw error;
    }
  }

  getProjectById(id: number): Project {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    return stmt.get(id) as Project;
  }

  // Task operations
  getTasks(filters: TaskFilters = {}): Task[] {
    let query = `
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.project_id !== undefined && filters.project_id !== null) {
      query += ' AND t.project_id = ?';
      params.push(filters.project_id);
    }

    if (filters.is_paid !== undefined && filters.is_paid !== null) {
      query += ' AND t.is_paid = ?';
      params.push(filters.is_paid ? 1 : 0);
    }

    if (filters.start_date && filters.start_date.trim() !== '') {
      query += ' AND DATE(t.start_time) >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date && filters.end_date.trim() !== '') {
      query += ' AND DATE(t.start_time) <= ?';
      params.push(filters.end_date);
    }

    if (filters.search && filters.search.trim() !== '') {
      query += ' AND (t.description LIKE ? OR p.name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.is_archived !== undefined && filters.is_archived !== null) {
      query += ' AND t.is_archived = ?';
      params.push(filters.is_archived ? 1 : 0);
    }

    query += ' ORDER BY t.start_time DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Task[];
  }

  createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task {
    try {
      // Validate that the project exists
      const projectExists = this.db.prepare('SELECT id FROM projects WHERE id = ?').get(task.project_id);
      if (!projectExists) {
        throw new Error(`Project with ID ${task.project_id} does not exist`);
      }

      const stmt = this.db.prepare(`
        INSERT INTO tasks (project_id, description, start_time, end_time, duration, is_paid, tags, notion_id, is_archived)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        task.project_id,
        task.description,
        task.start_time,
        task.end_time,
        task.duration,
        task.is_paid ? 1 : 0,
        task.tags,
        task.notion_id,
        task.is_archived ? 1 : 0
      );

      if (!result.lastInsertRowid) {
        throw new Error('Failed to insert task - no ID returned');
      }

      return this.getTaskById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error creating task:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create task');
    }
  }

  updateTask(task: Task): Task {
    try {
      const stmt = this.db.prepare(`
        UPDATE tasks 
        SET project_id = ?, description = ?, start_time = ?, end_time = ?, duration = ?, 
            is_paid = ?, tags = ?, notion_id = ?, is_archived = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(
        task.project_id,
        task.description,
        task.start_time,
        task.end_time,
        task.duration,
        task.is_paid ? 1 : 0,
        task.tags,
        task.notion_id,
        task.is_archived ? 1 : 0,
        task.id
      );

      return this.getTaskById(task.id!);
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  }

  deleteTask(id: number): void {
    try {
      const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
      stmt.run(id);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  }

  getTaskById(id: number): Task {
    const stmt = this.db.prepare(`
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `);
    return stmt.get(id) as Task;
  }

  // Report generation
  generateReport(filters: TaskFilters = {}): ReportData {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.start_date && filters.start_date.trim() !== '') {
      whereClause += ' AND DATE(t.start_time) >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date && filters.end_date.trim() !== '') {
      whereClause += ' AND DATE(t.start_time) <= ?';
      params.push(filters.end_date);
    }

    if (filters.project_id !== undefined && filters.project_id !== null) {
      whereClause += ' AND t.project_id = ?';
      params.push(filters.project_id);
    }

    // Total hours
    const totalStmt = this.db.prepare(`
      SELECT 
        COALESCE(SUM(t.duration), 0) as total_hours,
        COALESCE(SUM(CASE WHEN t.is_paid = 1 THEN t.duration ELSE 0 END), 0) as paid_hours,
        COALESCE(SUM(CASE WHEN t.is_paid = 0 THEN t.duration ELSE 0 END), 0) as unpaid_hours,
        COUNT(*) as tasks_count
      FROM tasks t
      ${whereClause}
    `);
    
    const totals = totalStmt.get(...params) as any;

    // Projects summary
    const projectsStmt = this.db.prepare(`
      SELECT 
        p.name as project_name,
        COALESCE(SUM(t.duration), 0) as hours,
        COUNT(*) as tasks_count
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      ${whereClause}
      GROUP BY p.id, p.name
      ORDER BY hours DESC
    `);
    
    const projectsSummary = projectsStmt.all(...params);

    // Daily summary
    const dailyStmt = this.db.prepare(`
      SELECT 
        DATE(t.start_time) as date,
        COALESCE(SUM(t.duration), 0) as hours,
        COUNT(*) as tasks_count
      FROM tasks t
      ${whereClause}
      GROUP BY DATE(t.start_time)
      ORDER BY date DESC
    `);
    
    const dailySummary = dailyStmt.all(...params);

    return {
      total_hours: totals.total_hours / 3600, // Convert seconds to hours
      paid_hours: totals.paid_hours / 3600,
      unpaid_hours: totals.unpaid_hours / 3600,
      tasks_count: totals.tasks_count,
      projects_summary: projectsSummary.map((p: any) => ({
        ...p,
        hours: p.hours / 3600
      })),
      daily_summary: dailySummary.map((d: any) => ({
        ...d,
        hours: d.hours / 3600
      }))
    };
  }

  close(): void {
    this.db.close();
  }
} 