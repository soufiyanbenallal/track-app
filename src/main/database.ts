import Database from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';

export interface Task {
  id: string;
  description: string;
  projectId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  isCompleted: boolean;
  isPaid: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  notionDatabaseId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  idleTimeoutMinutes: number;
  notionApiKey?: string;
  notionWorkspaceId?: string;
  autoSyncToNotion: boolean;
}

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    const dbPath = join(app.getPath('userData'), 'track-app.db');
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  private initializeTables(): void {
    // Projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        notionDatabaseId TEXT,
        isArchived INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        projectId TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        duration INTEGER,
        isCompleted INTEGER DEFAULT 0,
        isPaid INTEGER DEFAULT 0,
        isArchived INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (projectId) REFERENCES projects (id)
      )
    `);

    // Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Insert default settings if they don't exist
    const defaultSettings = {
      idleTimeoutMinutes: 5,
      autoSyncToNotion: false
    };

    Object.entries(defaultSettings).forEach(([key, value]) => {
      const stmt = this.db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
      stmt.run(key, JSON.stringify(value));
    });

    // Database migration: Add isCompleted column if it doesn't exist
    this.migrateDatabase();
  }

  private migrateDatabase(): void {
    try {
      // Check if isCompleted column exists
      const tableInfo = this.db.prepare("PRAGMA table_info(tasks)").all() as any[];
      const hasIsCompleted = tableInfo.some(column => column.name === 'isCompleted');
      
      if (!hasIsCompleted) {
        console.log('Adding isCompleted column to tasks table...');
        this.db.exec('ALTER TABLE tasks ADD COLUMN isCompleted INTEGER DEFAULT 0');
        console.log('Database migration completed successfully');
      }
    } catch (error) {
      console.error('Database migration error:', error);
    }
  }

  // Task operations
  async getTasks(filters?: {
    projectId?: string;
    startDate?: string;
    endDate?: string;
    isPaid?: boolean;
    isArchived?: boolean;
  }): Promise<Task[]> {
    let query = `
      SELECT t.*, p.name as projectName, p.color as projectColor
      FROM tasks t
      LEFT JOIN projects p ON t.projectId = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.projectId) {
      query += ' AND t.projectId = ?';
      params.push(filters.projectId);
    }

    if (filters?.startDate) {
      query += ' AND t.startTime >= ?';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ' AND t.startTime <= ?';
      params.push(filters.endDate);
    }

    if (filters?.isPaid !== undefined) {
      query += ' AND t.isPaid = ?';
      params.push(filters.isPaid ? 1 : 0);
    }

    if (filters?.isArchived !== undefined) {
      query += ' AND t.isArchived = ?';
      params.push(filters.isArchived ? 1 : 0);
    }

    query += ' ORDER BY t.startTime DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(params) as Task[];
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, description, projectId, startTime, endTime, duration, isCompleted, isPaid, isArchived, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      task.description,
      task.projectId,
      task.startTime,
      task.endTime,
      task.duration,
      task.isCompleted ? 1 : 0,
      task.isPaid ? 1 : 0,
      task.isArchived ? 1 : 0,
      now,
      now
    );

    return this.getTaskById(id);
  }

  async updateTask(task: Partial<Task> & { id: string }): Promise<Task> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(task).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    updates.push('updatedAt = ?');
    params.push(now);
    params.push(task.id);

    const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    stmt.run(params);

    return this.getTaskById(task.id);
  }

  async deleteTask(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(id);
  }

  private async getTaskById(id: string): Promise<Task> {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    return stmt.get(id) as Task;
  }

  // Project operations
  async getProjects(isArchived?: boolean): Promise<Project[]> {
    let query = 'SELECT * FROM projects';
    const params: any[] = [];

    if (isArchived !== undefined) {
      query += ' WHERE isArchived = ?';
      params.push(isArchived ? 1 : 0);
    }

    query += ' ORDER BY name';

    const stmt = this.db.prepare(query);
    return stmt.all(params) as Project[];
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, color, notionDatabaseId, isArchived, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      project.name,
      project.color,
      project.notionDatabaseId,
      project.isArchived ? 1 : 0,
      now,
      now
    );

    return this.getProjectById(id);
  }

  async updateProject(project: Partial<Project> & { id: string }): Promise<Project> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(project).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    updates.push('updatedAt = ?');
    params.push(now);
    params.push(project.id);

    const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    stmt.run(params);

    return this.getProjectById(project.id);
  }

  async deleteProject(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run(id);
  }

  private async getProjectById(id: string): Promise<Project> {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    return stmt.get(id) as Project;
  }

  // Settings operations
  async getSettings(): Promise<Settings> {
    const stmt = this.db.prepare('SELECT key, value FROM settings');
    const rows = stmt.all() as { key: string; value: string }[];

    const settings: any = {};
    rows.forEach(row => {
      settings[row.key] = JSON.parse(row.value);
    });

    return settings as Settings;
  }

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    Object.entries(settings).forEach(([key, value]) => {
      const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      stmt.run(key, JSON.stringify(value));
    });
  }

  // Time calculation utilities
  async getTotalTimeForPeriod(startDate: string, endDate: string): Promise<number> {
    try {
      // Try with isCompleted column first
      const stmt = this.db.prepare(`
        SELECT COALESCE(SUM(duration), 0) as totalTime
        FROM tasks
        WHERE startTime >= ? AND startTime <= ? AND isCompleted = 1
      `);
      const result = stmt.get(startDate, endDate) as { totalTime: number };
      return result.totalTime || 0;
    } catch (error) {
      // Fallback: try without isCompleted column (for older databases)
      try {
        const stmt = this.db.prepare(`
          SELECT COALESCE(SUM(duration), 0) as totalTime
          FROM tasks
          WHERE startTime >= ? AND startTime <= ? AND duration IS NOT NULL
        `);
        const result = stmt.get(startDate, endDate) as { totalTime: number };
        return result.totalTime || 0;
      } catch (fallbackError) {
        console.error('Error getting total time for period:', error);
        return 0;
      }
    }
  }

  async getTotalTimeForToday(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = today + 'T00:00:00.000Z';
    const endOfDay = today + 'T23:59:59.999Z';
    return this.getTotalTimeForPeriod(startOfDay, endOfDay);
  }

  async getTotalTimeForWeek(): Promise<number> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);
    
    return this.getTotalTimeForPeriod(startOfWeek.toISOString(), endOfWeek.toISOString());
  }

  async getTotalTimeForMonth(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return this.getTotalTimeForPeriod(startOfMonth.toISOString(), endOfMonth.toISOString());
  }

  async getCompletedTasksCount(): Promise<number> {
    try {
      // Try with isCompleted column first
      const stmt = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM tasks
        WHERE isCompleted = 1
      `);
      const result = stmt.get() as { count: number };
      return result.count || 0;
    } catch (error) {
      // Fallback: try without isCompleted column (for older databases)
      try {
        const stmt = this.db.prepare(`
          SELECT COUNT(*) as count
          FROM tasks
          WHERE duration IS NOT NULL
        `);
        const result = stmt.get() as { count: number };
        return result.count || 0;
      } catch (fallbackError) {
        console.error('Error getting completed tasks count:', error);
        return 0;
      }
    }
  }

  async getActiveProjectsCount(): Promise<number> {
    try {
      // Try with isCompleted column first
      const stmt = this.db.prepare(`
        SELECT COUNT(DISTINCT projectId) as count
        FROM tasks
        WHERE isCompleted = 1 AND isArchived = 0
      `);
      const result = stmt.get() as { count: number };
      return result.count || 0;
    } catch (error) {
      // Fallback: try without isCompleted column (for older databases)
      try {
        const stmt = this.db.prepare(`
          SELECT COUNT(DISTINCT projectId) as count
          FROM tasks
          WHERE duration IS NOT NULL AND isArchived = 0
        `);
        const result = stmt.get() as { count: number };
        return result.count || 0;
      } catch (fallbackError) {
        console.error('Error getting active projects count:', error);
        return 0;
      }
    }
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM tasks
      WHERE projectId = ? AND isCompleted = 1
      ORDER BY startTime DESC
    `);
    return stmt.all(projectId) as Task[];
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  close(): void {
    this.db.close();
  }
} 