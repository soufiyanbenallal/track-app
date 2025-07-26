import Database from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';

export interface Task {
  id: string;
  description: string;
  projectId: string;
  customerId?: string;
  tags?: string;
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
  customerId?: string;
  notionDatabaseId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  idleTimeoutMinutes: number;
  notionApiKey?: string;
  notionWorkspaceId?: string;
  autoSyncToNotion: boolean;
  hourlyRate: number;
  defaultDateRange: string;
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
        customerId TEXT,
        notionDatabaseId TEXT,
        isArchived INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (customerId) REFERENCES customers (id)
      )
    `);

    // Customers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        isArchived INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Tags table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
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
        customerId TEXT,
        tags TEXT,
        startTime TEXT NOT NULL,
        endTime TEXT,
        duration INTEGER,
        isCompleted INTEGER DEFAULT 0,
        isPaid INTEGER DEFAULT 0,
        isArchived INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (projectId) REFERENCES projects (id),
        FOREIGN KEY (customerId) REFERENCES customers (id)
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
      autoSyncToNotion: false,
      hourlyRate: 100,
      defaultDateRange: '7'
    };

    Object.entries(defaultSettings).forEach(([key, value]) => {
      const stmt = this.db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
      stmt.run(key, JSON.stringify(value));
    });

    // Database migration: Add new columns if they don't exist
    this.migrateDatabase();
  }

  private migrateDatabase(): void {
    try {
      // Check if new columns exist in tasks table
      const taskTableInfo = this.db.prepare("PRAGMA table_info(tasks)").all() as any[];
      const taskColumns = taskTableInfo.map(col => col.name);
      
      if (!taskColumns.includes('isCompleted')) {
        console.log('Adding isCompleted column to tasks table...');
        this.db.exec('ALTER TABLE tasks ADD COLUMN isCompleted INTEGER DEFAULT 0');
      }
      
      if (!taskColumns.includes('customerId')) {
        console.log('Adding customerId column to tasks table...');
        this.db.exec('ALTER TABLE tasks ADD COLUMN customerId TEXT');
      }
      
      if (!taskColumns.includes('tags')) {
        console.log('Adding tags column to tasks table...');
        this.db.exec('ALTER TABLE tasks ADD COLUMN tags TEXT');
      }
      
      // Check if new columns exist in projects table
      const projectTableInfo = this.db.prepare("PRAGMA table_info(projects)").all() as any[];
      const projectColumns = projectTableInfo.map(col => col.name);
      
      if (!projectColumns.includes('customerId')) {
        console.log('Adding customerId column to projects table...');
        this.db.exec('ALTER TABLE projects ADD COLUMN customerId TEXT');
      }
      
      console.log('Database migration completed successfully');
    } catch (error) {
      console.error('Database migration error:', error);
    }
  }

  // Task operations
  async getTasks(filters?: {
    projectId?: string;
    customerId?: string;
    tags?: string;
    startDate?: string;
    endDate?: string;
    isPaid?: boolean;
    isCompleted?: boolean;
    isArchived?: boolean;
    search?: string;
  }): Promise<Task[]> {
    let query = `
      SELECT t.*, p.name as projectName, p.color as projectColor, c.name as customerName
      FROM tasks t
      LEFT JOIN projects p ON t.projectId = p.id
      LEFT JOIN customers c ON t.customerId = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.projectId) {
      query += ' AND t.projectId = ?';
      params.push(filters.projectId);
    }

    if (filters?.customerId) {
      query += ' AND t.customerId = ?';
      params.push(filters.customerId);
    }

    if (filters?.tags) {
      query += ' AND t.tags LIKE ?';
      params.push(`%${filters.tags}%`);
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

    if (filters?.isCompleted !== undefined) {
      query += ' AND t.isCompleted = ?';
      params.push(filters.isCompleted ? 1 : 0);
    }

    if (filters?.isArchived !== undefined) {
      query += ' AND t.isArchived = ?';
      params.push(filters.isArchived ? 1 : 0);
    }

    if (filters?.search) {
      query += ' AND (t.description LIKE ? OR p.name LIKE ? OR c.name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY t.startTime DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(params) as Task[];
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, description, projectId, customerId, tags, startTime, endTime, duration, isCompleted, isPaid, isArchived, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      task.description,
      task.projectId,
      task.customerId,
      task.tags,
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
    const stmt = this.db.prepare(`
      SELECT t.*, p.name as projectName, p.color as projectColor, c.name as customerName
      FROM tasks t
      LEFT JOIN projects p ON t.projectId = p.id
      LEFT JOIN customers c ON t.customerId = c.id
      WHERE t.id = ?
    `);
    return stmt.get(id) as Task;
  }

  // Project operations
  async getProjects(isArchived?: boolean): Promise<Project[]> {
    let query = `
      SELECT p.*, c.name as customerName
      FROM projects p
      LEFT JOIN customers c ON p.customerId = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (isArchived !== undefined) {
      query += ' AND p.isArchived = ?';
      params.push(isArchived ? 1 : 0);
    }

    query += ' ORDER BY p.name';

    const stmt = this.db.prepare(query);
    return stmt.all(params) as Project[];
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, color, customerId, notionDatabaseId, isArchived, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      project.name,
      project.color,
      project.customerId,
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

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE isArchived = 0 ORDER BY name');
    return stmt.all() as Customer[];
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO customers (id, name, email, phone, address, isArchived, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.isArchived ? 1 : 0,
      now,
      now
    );

    return this.getCustomerById(id);
  }

  async updateCustomer(customer: Partial<Customer> & { id: string }): Promise<Customer> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(customer).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    updates.push('updatedAt = ?');
    params.push(now);
    params.push(customer.id);

    const query = `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    stmt.run(params);

    return this.getCustomerById(customer.id);
  }

  async deleteCustomer(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM customers WHERE id = ?');
    stmt.run(id);
  }

  private async getCustomerById(id: string): Promise<Customer> {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE id = ?');
    return stmt.get(id) as Customer;
  }

  // Tag operations
  async getTags(): Promise<Tag[]> {
    const stmt = this.db.prepare('SELECT * FROM tags WHERE isArchived = 0 ORDER BY name');
    return stmt.all() as Tag[];
  }

  async createTag(tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tag> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO tags (id, name, color, isArchived, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      tag.name,
      tag.color,
      tag.isArchived ? 1 : 0,
      now,
      now
    );

    return this.getTagById(id);
  }

  async updateTag(tag: Partial<Tag> & { id: string }): Promise<Tag> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(tag).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    updates.push('updatedAt = ?');
    params.push(now);
    params.push(tag.id);

    const query = `UPDATE tags SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    stmt.run(params);

    return this.getTagById(tag.id);
  }

  async deleteTag(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM tags WHERE id = ?');
    stmt.run(id);
  }

  private async getTagById(id: string): Promise<Tag> {
    const stmt = this.db.prepare('SELECT * FROM tags WHERE id = ?');
    return stmt.get(id) as Tag;
  }

  // Bulk operations
  async bulkUpdateTaskStatus(taskIds: string[], updates: Partial<Task>): Promise<void> {
    const now = new Date().toISOString();
    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    updateFields.push('updatedAt = ?');
    params.push(now);

    const placeholders = taskIds.map(() => '?').join(',');
    const query = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id IN (${placeholders})`;
    
    const stmt = this.db.prepare(query);
    stmt.run(...params, ...taskIds);
  }

  async bulkArchivePaidTasks(): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE tasks 
      SET isArchived = 1, updatedAt = ? 
      WHERE isPaid = 1 AND isArchived = 0
    `);
    stmt.run(new Date().toISOString());
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

  async saveDraftTask(task: Partial<Task>): Promise<Task> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, description, projectId, customerId, tags, startTime, endTime, duration, isCompleted, isPaid, isArchived, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
    `);
    
    stmt.run(
      id,
      task.description || 'Interrupted session',
      task.projectId,
      task.customerId || null,
      task.tags || null,
      task.startTime,
      now, // Set endTime to when interruption occurred
      task.duration || 0,
      now,
      now
    );
    
    return this.getTaskById(id);
  }

  // Method to convert draft to completed task
  async completeDraftTask(taskId: string, finalEndTime: string, finalDuration: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE tasks 
      SET endTime = ?, duration = ?, isCompleted = 1, updatedAt = ?
      WHERE id = ?
    `);
    
    stmt.run(finalEndTime, finalDuration, new Date().toISOString(), taskId);
  }
} 