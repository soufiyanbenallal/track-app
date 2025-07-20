import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  getProjects: () => ipcRenderer.invoke('db:get-projects'),
  getAllProjects: () => ipcRenderer.invoke('db:get-all-projects'),
  createProject: (project: any) => ipcRenderer.invoke('db:create-project', project),
  updateProject: (project: any) => ipcRenderer.invoke('db:update-project', project),
  deleteProject: (id: number) => ipcRenderer.invoke('db:delete-project', id),
  deleteProjectWithTasks: (id: number) => ipcRenderer.invoke('db:delete-project-with-tasks', id),
  
  getTasks: (filters: any) => ipcRenderer.invoke('db:get-tasks', filters),
  createTask: (task: any) => ipcRenderer.invoke('db:create-task', task),
  updateTask: (task: any) => ipcRenderer.invoke('db:update-task', task),
  deleteTask: (id: number) => ipcRenderer.invoke('db:delete-task', id),
  
  // Time tracking
  startTracking: (taskId: number) => ipcRenderer.invoke('tracker:start', taskId),
  stopTracking: () => ipcRenderer.invoke('tracker:stop'),
  getCurrentTask: () => ipcRenderer.invoke('tracker:get-current'),
  getTrackingStatus: () => ipcRenderer.invoke('tracker:get-status'),
  
  // Notion integration
  syncTaskToNotion: (taskId: number) => ipcRenderer.invoke('notion:sync-task', taskId),
  getNotionProjects: () => ipcRenderer.invoke('notion:get-projects'),
  
  // Reports
  generateReport: (filters: any) => ipcRenderer.invoke('reports:generate', filters),
  
  // Events
  onTrackingUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('tracking-update', (_, data) => callback(data));
  },
  
  onIdleStateChange: (callback: (isIdle: boolean) => void) => {
    ipcRenderer.on('idle-state-change', (_, isIdle) => callback(isIdle));
  }
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getProjects: () => Promise<any[]>;
      getAllProjects: () => Promise<any[]>;
      createProject: (project: any) => Promise<any>;
      updateProject: (project: any) => Promise<any>;
      deleteProject: (id: number) => Promise<void>;
      deleteProjectWithTasks: (id: number) => Promise<void>;
      
      getTasks: (filters: any) => Promise<any[]>;
      createTask: (task: any) => Promise<any>;
      updateTask: (task: any) => Promise<any>;
      deleteTask: (id: number) => Promise<void>;
      
      startTracking: (taskId: number) => Promise<void>;
      stopTracking: () => Promise<void>;
      getCurrentTask: () => Promise<any>;
      getTrackingStatus: () => Promise<any>;
      
      syncTaskToNotion: (taskId: number) => Promise<void>;
      getNotionProjects: () => Promise<any[]>;
      
      generateReport: (filters: any) => Promise<any>;
      
      onTrackingUpdate: (callback: (data: any) => void) => void;
      onIdleStateChange: (callback: (isIdle: boolean) => void) => void;
    };
  }
} 