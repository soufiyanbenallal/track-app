import Store from 'electron-store';

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
  isInterrupted: boolean;
  isDraft: boolean;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  projectColor?: string;
  customerName?: string;
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
  private tasksStore: Store;
  private projectsStore: Store;
  private customersStore: Store;
  private tagsStore: Store;
  private settingsStore: Store;

  constructor() {
    this.tasksStore = new Store({ name: 'tasks' });
    this.projectsStore = new Store({ name: 'projects' });
    this.customersStore = new Store({ name: 'customers' });
    this.tagsStore = new Store({ name: 'tags' });
    this.settingsStore = new Store({ name: 'settings' });
    
    this.initializeDefaultSettings();
  }

  private initializeDefaultSettings(): void {
    const defaultSettings = {
      idleTimeoutMinutes: 5,
      autoSyncToNotion: false,
      hourlyRate: 100,
      defaultDateRange: '7'
    };

    Object.entries(defaultSettings).forEach(([key, value]) => {
      if (!this.settingsStore.has(key)) {
        this.settingsStore.set(key, value);
      }
    });
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
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    let filteredTasks = tasks;

    if (filters?.projectId) {
      filteredTasks = filteredTasks.filter(task => task.projectId === filters.projectId);
    }

    if (filters?.customerId) {
      filteredTasks = filteredTasks.filter(task => task.customerId === filters.customerId);
    }

    if (filters?.tags) {
      filteredTasks = filteredTasks.filter(task => 
        task.tags && task.tags.includes(filters.tags!)
      );
    }

    if (filters?.startDate) {
      filteredTasks = filteredTasks.filter(task => task.startTime >= filters.startDate!);
    }

    if (filters?.endDate) {
      filteredTasks = filteredTasks.filter(task => task.startTime <= filters.endDate!);
    }

    if (filters?.isPaid !== undefined) {
      filteredTasks = filteredTasks.filter(task => task.isPaid === filters.isPaid);
    }

    if (filters?.isCompleted !== undefined) {
      filteredTasks = filteredTasks.filter(task => task.isCompleted === filters.isCompleted);
    }

    if (filters?.isArchived !== undefined) {
      filteredTasks = filteredTasks.filter(task => task.isArchived === filters.isArchived);
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.description.toLowerCase().includes(searchTerm) ||
        task.projectName.toLowerCase().includes(searchTerm) ||
        (task.customerName && task.customerName.toLowerCase().includes(searchTerm))
      );
    }

    // Add project and customer information
    const projects = await this.getProjects();
    const customers = await this.getCustomers();
    
    return filteredTasks.map(task => {
      const project = projects.find(p => p.id === task.projectId);
      const customer = customers.find(c => c.id === task.customerId);
      
      return {
        ...task,
        projectName: project?.name || 'Unknown Project',
        projectColor: project?.color || '#000000',
        customerName: customer?.name || undefined
      };
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const id = this.generateId();
    const now = new Date().toISOString();
    const projects = await this.getProjects();
    const customers = await this.getCustomers();
    
    const project = projects.find(p => p.id === task.projectId);
    const customer = customers.find(c => c.id === task.customerId);

    const newTask: Task = {
      id,
      description: task.description,
      projectId: task.projectId,
      customerId: task.customerId,
      tags: task.tags,
      startTime: task.startTime,
      endTime: task.endTime,
      duration: task.duration,
      isCompleted: task.isCompleted,
      isPaid: task.isPaid,
      isArchived: task.isArchived,
      isInterrupted: task.isInterrupted,
      isDraft: task.isDraft,
      projectName: project?.name || 'Unknown Project',
      createdAt: now,
      updatedAt: now,
      projectColor: project?.color || '#000000',
      customerName: customer?.name
    };

    const tasks = this.tasksStore.get('tasks', []) as Task[];
    tasks.push(newTask);
    this.tasksStore.set('tasks', tasks);

    return newTask;
  }

  async updateTask(task: Partial<Task> & { id: string }): Promise<Task> {
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    const taskIndex = tasks.findIndex(t => t.id === task.id);
    
    if (taskIndex === -1) {
      throw new Error(`Task with id ${task.id} not found`);
    }

    const now = new Date().toISOString();
    const updatedTask = {
      ...tasks[taskIndex],
      ...task,
      updatedAt: now
    };

    tasks[taskIndex] = updatedTask;
    this.tasksStore.set('tasks', tasks);

    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    const filteredTasks = tasks.filter(task => task.id !== id);
    this.tasksStore.set('tasks', filteredTasks);
  }

  // Project operations
  async getProjects(isArchived?: boolean): Promise<Project[]> {
    const projects = this.projectsStore.get('projects', []) as Project[];
    
    if (isArchived !== undefined) {
      return projects.filter(project => project.isArchived === isArchived);
    }
    
    return projects.sort((a, b) => a.name.localeCompare(b.name));
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const newProject: Project = {
      id,
      name: project.name,
      color: project.color,
      customerId: project.customerId,
      notionDatabaseId: project.notionDatabaseId,
      isArchived: project.isArchived,
      createdAt: now,
      updatedAt: now
    };

    const projects = this.projectsStore.get('projects', []) as Project[];
    projects.push(newProject);
    this.projectsStore.set('projects', projects);

    return newProject;
  }

  async updateProject(project: Partial<Project> & { id: string }): Promise<Project> {
    const projects = this.projectsStore.get('projects', []) as Project[];
    const projectIndex = projects.findIndex(p => p.id === project.id);
    
    if (projectIndex === -1) {
      throw new Error(`Project with id ${project.id} not found`);
    }

    const now = new Date().toISOString();
    const updatedProject = {
      ...projects[projectIndex],
      ...project,
      updatedAt: now
    };

    projects[projectIndex] = updatedProject;
    this.projectsStore.set('projects', projects);

    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    // Delete all tasks associated with this project
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    const filteredTasks = tasks.filter(task => task.projectId !== id);
    this.tasksStore.set('tasks', filteredTasks);
    
    // Delete the project
    const projects = this.projectsStore.get('projects', []) as Project[];
    const filteredProjects = projects.filter(project => project.id !== id);
    this.projectsStore.set('projects', filteredProjects);
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    const customers = this.customersStore.get('customers', []) as Customer[];
    return customers.filter(customer => !customer.isArchived).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const newCustomer: Customer = {
      id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      isArchived: customer.isArchived,
      createdAt: now,
      updatedAt: now
    };

    const customers = this.customersStore.get('customers', []) as Customer[];
    customers.push(newCustomer);
    this.customersStore.set('customers', customers);

    return newCustomer;
  }

  async updateCustomer(customer: Partial<Customer> & { id: string }): Promise<Customer> {
    const customers = this.customersStore.get('customers', []) as Customer[];
    const customerIndex = customers.findIndex(c => c.id === customer.id);
    
    if (customerIndex === -1) {
      throw new Error(`Customer with id ${customer.id} not found`);
    }

    const now = new Date().toISOString();
    const updatedCustomer = {
      ...customers[customerIndex],
      ...customer,
      updatedAt: now
    };

    customers[customerIndex] = updatedCustomer;
    this.customersStore.set('customers', customers);

    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    const customers = this.customersStore.get('customers', []) as Customer[];
    const filteredCustomers = customers.filter(customer => customer.id !== id);
    this.customersStore.set('customers', filteredCustomers);
  }

  // Tag operations
  async getTags(): Promise<Tag[]> {
    const tags = this.tagsStore.get('tags', []) as Tag[];
    return tags.filter(tag => !tag.isArchived).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createTag(tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tag> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const newTag: Tag = {
      id,
      name: tag.name,
      color: tag.color,
      isArchived: tag.isArchived,
      createdAt: now,
      updatedAt: now
    };

    const tags = this.tagsStore.get('tags', []) as Tag[];
    tags.push(newTag);
    this.tagsStore.set('tags', tags);

    return newTag;
  }

  async updateTag(tag: Partial<Tag> & { id: string }): Promise<Tag> {
    const tags = this.tagsStore.get('tags', []) as Tag[];
    const tagIndex = tags.findIndex(t => t.id === tag.id);
    
    if (tagIndex === -1) {
      throw new Error(`Tag with id ${tag.id} not found`);
    }

    const now = new Date().toISOString();
    const updatedTag = {
      ...tags[tagIndex],
      ...tag,
      updatedAt: now
    };

    tags[tagIndex] = updatedTag;
    this.tagsStore.set('tags', tags);

    return updatedTag;
  }

  async deleteTag(id: string): Promise<void> {
    const tags = this.tagsStore.get('tags', []) as Tag[];
    const filteredTags = tags.filter(tag => tag.id !== id);
    this.tagsStore.set('tags', filteredTags);
  }

  // Bulk operations
  async bulkUpdateTaskStatus(taskIds: string[], updates: Partial<Task>): Promise<void> {
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    const now = new Date().toISOString();

    const updatedTasks = tasks.map(task => {
      if (taskIds.includes(task.id)) {
        return {
          ...task,
          ...updates,
          updatedAt: now
        };
      }
      return task;
    });

    this.tasksStore.set('tasks', updatedTasks);
  }

  async bulkArchivePaidTasks(): Promise<void> {
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    const now = new Date().toISOString();

    const updatedTasks = tasks.map(task => {
      if (task.isPaid && !task.isArchived) {
        return {
          ...task,
          isArchived: true,
          updatedAt: now
        };
      }
      return task;
    });

    this.tasksStore.set('tasks', updatedTasks);
  }

  // Settings operations
  async getSettings(): Promise<Settings> {
    const settings: any = {};
    const defaultSettings = {
      idleTimeoutMinutes: 5,
      autoSyncToNotion: false,
      hourlyRate: 100,
      defaultDateRange: '7'
    };

    Object.keys(defaultSettings).forEach(key => {
      settings[key] = this.settingsStore.get(key, defaultSettings[key as keyof typeof defaultSettings]);
    });

    return settings as Settings;
  }

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    Object.entries(settings).forEach(([key, value]) => {
      this.settingsStore.set(key, value);
    });
  }

  // Time calculation utilities
  async getTotalTimeForPeriod(startDate: string, endDate: string): Promise<number> {
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    const filteredTasks = tasks.filter(task => 
      task.startTime >= startDate && 
      task.startTime <= endDate && 
      task.isCompleted && 
      task.duration
    );
    
    return filteredTasks.reduce((total, task) => total + (task.duration || 0), 0);
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
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    return tasks.filter(task => task.isCompleted).length;
  }

  async getActiveProjectsCount(): Promise<number> {
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    const completedTaskProjectIds = new Set(
      tasks.filter(task => task.isCompleted && !task.isArchived).map(task => task.projectId)
    );
    return completedTaskProjectIds.size;
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    return tasks.filter(task => task.projectId === projectId && task.isCompleted)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  close(): void {
    // electron-store automatically saves data, no need to close
  }

  async saveDraftTask(task: Partial<Task>): Promise<Task> {
    const id = this.generateId();
    const now = new Date().toISOString();
    const projects = await this.getProjects();
    
    if (!task.projectId) {
      throw new Error('Project ID is required for draft task');
    }
    if (!task.startTime) {
      throw new Error('Start time is required for draft task');
    }
    
    const project = projects.find(p => p.id === task.projectId);

    const newTask: Task = {
      id,
      description: task.description || 'Interrupted session',
      projectId: task.projectId,
      customerId: task.customerId,
      tags: task.tags,
      startTime: task.startTime,
      endTime: now,
      duration: task.duration || 0,
      isCompleted: false,
      isPaid: false,
      isArchived: false,
      isInterrupted: false,
      isDraft: true,
      projectName: project?.name || 'Unknown Project',
      createdAt: now,
      updatedAt: now,
      projectColor: project?.color || '#000000'
    };

    const tasks = this.tasksStore.get('tasks', []) as Task[];
    tasks.push(newTask);
    this.tasksStore.set('tasks', tasks);

    return newTask;
  }

  async completeDraftTask(taskId: string, finalEndTime: string, finalDuration: number): Promise<void> {
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        endTime: finalEndTime,
        duration: finalDuration,
        isCompleted: true,
        updatedAt: new Date().toISOString()
      };
      this.tasksStore.set('tasks', tasks);
    }
  }

  async saveInterruptedTask(task: Partial<Task>): Promise<Task> {
    const id = this.generateId();
    const now = new Date().toISOString();
    const projects = await this.getProjects();
    
    if (!task.projectId) {
      throw new Error('Project ID is required for interrupted task');
    }
    if (!task.startTime) {
      throw new Error('Start time is required for interrupted task');
    }
    
    const project = projects.find(p => p.id === task.projectId);

    const newTask: Task = {
      id,
      description: task.description || 'Interrupted session',
      projectId: task.projectId,
      customerId: task.customerId,
      tags: task.tags,
      startTime: task.startTime,
      endTime: task.endTime || now,
      duration: task.duration || 0,
      isCompleted: false,
      isPaid: false,
      isArchived: false,
      isInterrupted: true,
      isDraft: false,
      projectName: project?.name || 'Unknown Project',
      createdAt: now,
      updatedAt: now,
      projectColor: project?.color || '#000000'
    };

    const tasks = this.tasksStore.get('tasks', []) as Task[];
    tasks.push(newTask);
    this.tasksStore.set('tasks', tasks);

    return newTask;
  }

  async getInterruptedTasks(): Promise<Task[]> {
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    const projects = await this.getProjects();
    const customers = await this.getCustomers();
    
    return tasks
      .filter(task => task.isInterrupted && !task.isArchived)
      .map(task => {
        const project = projects.find(p => p.id === task.projectId);
        const customer = customers.find(c => c.id === task.customerId);
        
        return {
          ...task,
          projectName: project?.name || 'Unknown Project',
          projectColor: project?.color || '#000000',
          customerName: customer?.name
        };
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async completeInterruptedTask(taskId: string): Promise<void> {
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        isCompleted: true,
        isInterrupted: false,
        updatedAt: new Date().toISOString()
      };
      this.tasksStore.set('tasks', tasks);
    }
  }

  async removeInterruptedTask(taskId: string): Promise<void> {
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    const filteredTasks = tasks.filter(task => !(task.id === taskId && task.isInterrupted));
    this.tasksStore.set('tasks', filteredTasks);
  }

  async updateInterruptedTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const tasks = this.tasksStore.get('tasks', []) as Task[];
    const taskIndex = tasks.findIndex(t => t.id === taskId && t.isInterrupted);
    
    if (taskIndex === -1) {
      throw new Error(`Interrupted task with id ${taskId} not found`);
    }

    const now = new Date().toISOString();
    const updatedTask = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: now
    };

    tasks[taskIndex] = updatedTask;
    this.tasksStore.set('tasks', tasks);

    return updatedTask;
  }
} 