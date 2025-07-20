import React, { createContext, useContext, useState, useEffect } from 'react';

interface Project {
  id?: number;
  name: string;
  description?: string;
  color?: string;
  notion_id?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface Task {
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
  project_name?: string;
  project_color?: string;
}

interface TaskFilters {
  project_id?: number;
  is_paid?: boolean;
  start_date?: string;
  end_date?: string;
  search?: string;
  is_archived?: boolean;
}

interface DataContextType {
  projects: Project[];
  tasks: Task[];
  loading: boolean;
  refreshProjects: () => Promise<void>;
  refreshAllProjects: () => Promise<void>;
  refreshTasks: (filters?: TaskFilters) => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<Project>;
  updateProject: (project: Project) => Promise<Project>;
  deleteProject: (id: number) => Promise<void>;
  deleteProjectWithTasks: (id: number) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProjects = async () => {
    try {
      if (!window.electronAPI) {
        console.warn('electronAPI not available yet');
        return;
      }
      const data = await window.electronAPI.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const refreshAllProjects = async () => {
    try {
      if (!window.electronAPI) {
        console.warn('electronAPI not available yet');
        return;
      }
      const data = await window.electronAPI.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching all projects:', error);
    }
  };

  const refreshTasks = async (filters: TaskFilters = {}) => {
    try {
      if (!window.electronAPI) {
        console.warn('electronAPI not available yet');
        return;
      }
      const data = await window.electronAPI.getTasks(filters);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!window.electronAPI) {
        throw new Error('electronAPI not available');
      }
      const newProject = await window.electronAPI.createProject(project);
      await refreshProjects();
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const updateProject = async (project: Project) => {
    try {
      const updatedProject = await window.electronAPI.updateProject(project);
      await refreshProjects();
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await window.electronAPI.deleteProject(id);
      await refreshProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const deleteProjectWithTasks = async (id: number) => {
    try {
      await window.electronAPI.deleteProjectWithTasks(id);
      await refreshProjects();
      await refreshTasks();
    } catch (error) {
      console.error('Error deleting project with tasks:', error);
      throw error;
    }
  };

  const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('DataContext: Creating task with data:', task);
      const newTask = await window.electronAPI.createTask(task);
      console.log('DataContext: Task created successfully:', newTask);
      await refreshTasks();
      return newTask;
    } catch (error) {
      console.error('DataContext: Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (task: Task) => {
    try {
      const updatedTask = await window.electronAPI.updateTask(task);
      await refreshTasks();
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await window.electronAPI.deleteTask(id);
      await refreshTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      // Wait for electronAPI to be available
      const initData = () => {
        if (window.electronAPI) {
          setLoading(true);
          Promise.all([refreshProjects(), refreshTasks()])
            .catch(error => {
              console.error('Error initializing data:', error);
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          // Retry after a short delay
          setTimeout(initData, 100);
        }
      };

      initData();
    };

    initializeData();
  }, []);

  return (
    <DataContext.Provider value={{
      projects,
      tasks,
      loading,
      refreshProjects,
      refreshAllProjects,
      refreshTasks,
      createProject,
      updateProject,
      deleteProject,
      deleteProjectWithTasks,
      createTask,
      updateTask,
      deleteTask
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
} 