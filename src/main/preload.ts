import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  getTasks: (filters?: any) => ipcRenderer.invoke('db-get-tasks', filters),
  createTask: (task: any) => ipcRenderer.invoke('db-create-task', task),
  updateTask: (task: any) => ipcRenderer.invoke('db-update-task', task),
  deleteTask: (id: string) => ipcRenderer.invoke('db-delete-task', id),
  
  // Time statistics
  getTotalTimeToday: () => ipcRenderer.invoke('db-get-total-time-today'),
  getTotalTimeWeek: () => ipcRenderer.invoke('db-get-total-time-week'),
  getTotalTimeMonth: () => ipcRenderer.invoke('db-get-total-time-month'),
  getCompletedTasksCount: () => ipcRenderer.invoke('db-get-completed-tasks-count'),
  getActiveProjectsCount: () => ipcRenderer.invoke('db-get-active-projects-count'),
  
  // Project operations
  getProjects: () => ipcRenderer.invoke('db-get-projects'),
  createProject: (project: any) => ipcRenderer.invoke('db-create-project', project),
  updateProject: (project: any) => ipcRenderer.invoke('db-update-project', project),
  deleteProject: (id: string) => ipcRenderer.invoke('db-delete-project', id),
  
  // Customer operations
  getCustomers: () => ipcRenderer.invoke('db-get-customers'),
  createCustomer: (customer: any) => ipcRenderer.invoke('db-create-customer', customer),
  updateCustomer: (customer: any) => ipcRenderer.invoke('db-update-customer', customer),
  deleteCustomer: (id: string) => ipcRenderer.invoke('db-delete-customer', id),
  
  // Tag operations
  getTags: () => ipcRenderer.invoke('db-get-tags'),
  createTag: (tag: any) => ipcRenderer.invoke('db-create-tag', tag),
  updateTag: (tag: any) => ipcRenderer.invoke('db-update-tag', tag),
  deleteTag: (id: string) => ipcRenderer.invoke('db-delete-tag', id),
  
  // Bulk operations
  bulkUpdateTaskStatus: (taskIds: string[], updates: any) => ipcRenderer.invoke('db-bulk-update-task-status', taskIds, updates),
  bulkArchivePaidTasks: () => ipcRenderer.invoke('db-bulk-archive-paid-tasks'),
  
  // Draft task operations
  saveDraftTask: (task: any) => ipcRenderer.invoke('db-save-draft-task', task),
  completeDraftTask: (taskId: string, finalEndTime: string, finalDuration: number) => ipcRenderer.invoke('db-complete-draft-task', taskId, finalEndTime, finalDuration),
  
  // Interrupted task operations
  saveInterruptedTask: (task: any) => ipcRenderer.invoke('db-save-interrupted-task', task),
  getInterruptedTasks: () => ipcRenderer.invoke('db-get-interrupted-tasks'),
  completeInterruptedTask: (taskId: string) => ipcRenderer.invoke('db-complete-interrupted-task', taskId),
  removeInterruptedTask: (taskId: string) => ipcRenderer.invoke('db-remove-interrupted-task', taskId),
  updateInterruptedTask: (taskId: string, updates: any) => ipcRenderer.invoke('db-update-interrupted-task', taskId, updates),
  
  // Idle dialog
  showIdleDialog: (idleTime: number) => ipcRenderer.invoke('show-idle-dialog', idleTime),
  getCurrentIdleTime: () => ipcRenderer.invoke('get-current-idle-time'),
  pauseIdleDetection: () => ipcRenderer.invoke('pause-idle-detection'),
  resumeIdleDetection: () => ipcRenderer.invoke('resume-idle-detection'),
  getPausedIdleTime: () => ipcRenderer.invoke('get-paused-idle-time'),
  
  // Notion operations
  syncTask: (task: any, project: any) => ipcRenderer.invoke('notion-sync-task', task, project),
  queueNotionSync: (task: any, project: any) => ipcRenderer.invoke('notion-queue-sync', task, project),
  updateNotionTask: (task: any, project: any, updateType: 'description' | 'deletion') => ipcRenderer.invoke('notion-update-task', task, project, updateType),
  getNotionDatabases: () => ipcRenderer.invoke('notion-get-databases'),
  setNotionApiKey: (apiKey: string) => ipcRenderer.invoke('notion-set-api-key', apiKey),
  testNotionConnection: () => ipcRenderer.invoke('notion-test-connection'),
  syncAllTasksToNotion: () => ipcRenderer.invoke('notion-sync-all-tasks'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),
  
  // Events
  onStartTracking: (callback: () => void) => {
    ipcRenderer.on('start-tracking', callback);
  },
  onStopTracking: (callback: () => void) => {
    ipcRenderer.on('stop-tracking', callback);
  },
  onUserIdle: (callback: (data: { idleTime: number }) => void) => {
    ipcRenderer.on('user-idle', (_, data) => callback(data));
  },
  onUserActive: (callback: () => void) => {
    ipcRenderer.on('user-active', callback);
  },
  
  // Event cleanup
  removeStartTracking: (callback: () => void) => {
    ipcRenderer.removeListener('start-tracking', callback);
  },
  removeStopTracking: (callback: () => void) => {
    ipcRenderer.removeListener('stop-tracking', callback);
  },
  removeUserIdle: (_callback: (data: { idleTime: number }) => void) => {
    ipcRenderer.removeAllListeners('user-idle');
  },
  removeUserActive: (callback: () => void) => {
    ipcRenderer.removeListener('user-active', callback);
  }
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getTasks: (filters?: any) => Promise<any[]>;
      createTask: (task: any) => Promise<any>;
      updateTask: (task: any) => Promise<any>;
      deleteTask: (id: string) => Promise<void>;
      getTotalTimeToday: () => Promise<number>;
      getTotalTimeWeek: () => Promise<number>;
      getTotalTimeMonth: () => Promise<number>;
      getCompletedTasksCount: () => Promise<number>;
      getActiveProjectsCount: () => Promise<number>;
      getProjects: () => Promise<any[]>;
      createProject: (project: any) => Promise<any>;
      updateProject: (project: any) => Promise<any>;
      deleteProject: (id: string) => Promise<void>;
      getCustomers: () => Promise<any[]>;
      createCustomer: (customer: any) => Promise<any>;
      updateCustomer: (customer: any) => Promise<any>;
      deleteCustomer: (id: string) => Promise<void>;
      getTags: () => Promise<any[]>;
      createTag: (tag: any) => Promise<any>;
      updateTag: (tag: any) => Promise<any>;
      deleteTag: (id: string) => Promise<void>;
      bulkUpdateTaskStatus: (taskIds: string[], updates: any) => Promise<void>;
      bulkArchivePaidTasks: () => Promise<void>;
      saveDraftTask: (task: any) => Promise<any>;
      completeDraftTask: (taskId: string, finalEndTime: string, finalDuration: number) => Promise<any>;
      saveInterruptedTask: (task: any) => Promise<any>;
      getInterruptedTasks: () => Promise<any[]>;
      completeInterruptedTask: (taskId: string) => Promise<void>;
      removeInterruptedTask: (taskId: string) => Promise<void>;
      updateInterruptedTask: (taskId: string, updates: any) => Promise<any>;
      showIdleDialog: (idleTime: number) => Promise<number>;
      getCurrentIdleTime: () => Promise<number>;
      pauseIdleDetection: () => Promise<void>;
      resumeIdleDetection: () => Promise<void>;
      getPausedIdleTime: () => Promise<number>;
      syncTask: (task: any, project: any) => Promise<any>;
      queueNotionSync: (task: any, project: any) => Promise<any>;
      updateNotionTask: (task: any, project: any, updateType: 'description' | 'deletion') => Promise<any>;
      getNotionDatabases: () => Promise<any[]>;
      setNotionApiKey: (apiKey: string) => Promise<boolean>;
      testNotionConnection: () => Promise<boolean>;
      syncAllTasksToNotion: () => Promise<{ successCount: number; errorCount: number; errors: string[]; totalTasks: number }>;
      getSettings: () => Promise<any>;
      updateSettings: (settings: any) => Promise<any>;
      onStartTracking: (callback: () => void) => void;
      onStopTracking: (callback: () => void) => void;
      onUserIdle: (callback: (data: { idleTime: number }) => void) => void;
      onUserActive: (callback: () => void) => void;
      removeStartTracking: (callback: () => void) => void;
      removeStopTracking: (callback: () => void) => void;
      removeUserIdle: (callback: (data: { idleTime: number }) => void) => void;
      removeUserActive: (callback: () => void) => void;
    };
  }
} 