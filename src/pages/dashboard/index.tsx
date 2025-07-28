import React, { useState, useEffect } from 'react';
import { useTracking } from '../../contexts/TrackingContext';
import { Button } from '@/components/ui/button';
import TaskEditModal from '../../components/TaskEditModal';

import ProjectCreateModal from '../../components/ProjectCreateModal';
import CustomerModal from '../../components/CustomerModal';
import StatsGrid from './components/StatsGrid';
import WorkspaceCard from './components/WorkspaceCard';
import RecentTasksCard from './components/RecentTasksCard';
import TaskForm from './components/TaskForm';
import InterruptedTaskCard from './components/InterruptedTaskCard';
import { Task } from '@/main/database';

interface Project {
  id: string;
  name: string;
  color: string;
  customerId?: string;
  notionDatabaseId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}



const Dashboard: React.FC = () => {
  const { state, startTracking, stopTracking, interruptTask, formatElapsedTime } = useTracking();
  const [task, setTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [inlineEditingTask, setInlineEditingTask] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState('');

  const [isProjectCreateModalOpen, setIsProjectCreateModalOpen] = useState(false);
  const [isCustomerCreateModalOpen, setIsCustomerCreateModalOpen] = useState(false);
  const [currentTaskDescription, setCurrentTaskDescription] = useState('');
  const [isTaskDescriptionEditing, setIsTaskDescriptionEditing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState({
    todayTime: 0,
    completedTasks: 0,
    activeProjects: 0,
    productivity: 0
  });
  const [interruptedTasks, setInterruptedTasks] = useState<Task[]>([]);

  // Load statistics and recent tasks
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Wait a bit for electronAPI to be available
        if (!window.electronAPI) {
          console.log('Waiting for electronAPI to be available...');
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await Promise.all([
          loadStats(),
          loadRecentTasks(),
          loadProjects(),
          loadCustomers(),
          loadInterruptedTasks()
        ]);
      } catch (error) {
        console.error('Error initializing dashboard data:', error);
      }
    };
    
    initializeData();
  }, []);

  const loadInterruptedTasks = async () => {
    try {
      if (window.electronAPI) {
        const tasks = await window.electronAPI.getInterruptedTasks();
        setInterruptedTasks(tasks);
      } else {
        console.warn('electronAPI not available for loading interrupted tasks');
      }
    } catch (error) {
      console.error('Error loading interrupted tasks:', error);
    }
  };

  const loadStats = async () => {
    try {
      if (window.electronAPI) {
        const [todayTime, completedTasks, activeProjects] = await Promise.all([
          window.electronAPI.getTotalTimeToday(),
          window.electronAPI.getCompletedTasksCount(),
          window.electronAPI.getActiveProjectsCount()
        ]);

        // Calculate productivity (hours worked today / 8 hours target)
        const hoursWorked = todayTime / 3600;
        const productivity = Math.min(Math.round((hoursWorked / 8) * 100), 100);

        setStats({
          todayTime,
          completedTasks,
          activeProjects,
          productivity
        });
      } else {
        console.warn('electronAPI not available for loading stats');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentTasks = async () => {
    try {
      if (window.electronAPI) {
        // Get recent tasks (last 10 completed tasks)
        const tasks = await window.electronAPI.getTasks({ isArchived: false });
        setRecentTasks(tasks.slice(0, 10));
      } else {
        console.warn('electronAPI not available for loading recent tasks');
      }
    } catch (error) {
      console.error('Error loading recent tasks:', error);
    }
  };

  const loadProjects = async () => {
    try {
      if (window.electronAPI) {
        const projectsData = await window.electronAPI.getProjects();
        setProjects(projectsData);
      } else {
        console.warn('electronAPI not available for loading projects');
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      if (window.electronAPI) {
        const customersData = await window.electronAPI.getCustomers();
        setCustomers(customersData);
      } else {
        console.warn('electronAPI not available for loading customers');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleCreateProject = () => {
    setIsProjectCreateModalOpen(true);
  };

  const handleProjectCreate = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.createProject(projectData);
        await loadProjects(); // Reload projects after creation
        setIsProjectCreateModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    }
  };

  const handleCreateCustomer = () => {
    setIsCustomerCreateModalOpen(true);
  };

  const handleCustomerCreate = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.createCustomer(customerData);
        await loadCustomers(); // Reload customers after creation
        setIsCustomerCreateModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error creating customer');
    }
  };

  const handleStartTracking = () => {
    if (!selectedProject || !currentTaskDescription.trim()) {
      alert('Please select a project and enter a task description');
      return;
    }

    startTracking(currentTaskDescription.trim(), selectedProject.id, selectedCustomer?.id);
  };

  const handleStartWithTime = (startTime: string) => {
    if (!selectedProject || !currentTaskDescription.trim()) {
      alert('Please select a project and enter a task description');
      return;
    }

    // Just use the custom start time, let the normal elapsed calculation work
    const start = new Date(startTime);
    const now = new Date();

    if (start <= now) {
      // Start with custom time, no initial duration needed
      startTracking(currentTaskDescription.trim(), selectedProject.id, selectedCustomer?.id, startTime, 0);
    } else {
      // If start time is in the future, just start normally
      startTracking(currentTaskDescription.trim(), selectedProject.id, selectedCustomer?.id);
    }
  };

  const handleResumeTask = (task: Task) => {
    // Start tracking directly with the task details
    setTask(task);
    startTracking(task.description, task.projectId, task.customerId);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleSaveTask = async (updatedTask: Partial<Task> & { id: string }) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.updateTask(updatedTask);
        await loadRecentTasks(); // Reload tasks after update
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.deleteTask(taskId);
        await loadRecentTasks(); // Reload tasks after deletion
        await loadStats(); // Reload stats after deletion
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task');
    }
  };

  const handleInlineEditStart = (task: Task) => {
    setInlineEditingTask(task.id);
    setInlineEditValue(task.description);
  };

  const handleInlineEditSave = async (task: Task) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.updateTask({
          id: task.id,
          description: inlineEditValue
        });
        await loadRecentTasks();
        setInlineEditingTask(null);
        setInlineEditValue('');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task');
    }
  };

  const handleInlineEditCancel = () => {
    setInlineEditingTask(null);
    setInlineEditValue('');
  };





  const handleStopTracking = async () => {
    try {
      await stopTracking();
      // Reload stats and recent tasks after stopping tracking
      await Promise.all([loadStats(), loadRecentTasks(), loadInterruptedTasks()]);
    } catch (error) {
      console.error('Error stopping tracking:', error);
      alert('Error stopping tracking');
    }
  };

  // Interrupted task handlers
  const handleCompleteInterruptedTask = async (taskId: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.completeInterruptedTask(taskId);
        await Promise.all([loadInterruptedTasks(), loadRecentTasks(), loadStats()]);
      }
    } catch (error) {
      console.error('Error completing interrupted task:', error);
      alert('Error completing interrupted task');
    }
  };

  const handleResumeInterruptedTask = (task: Task) => {
    // Calculate elapsed time since interruption
    const startTime = new Date(task.startTime);
    const now = new Date();
    const timeSinceStart = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    setTask(task);
    startTracking(task.description, task.projectId, task.customerId, task.startTime, timeSinceStart);
    
    // Remove the interrupted task since we're resuming it
    handleRemoveInterruptedTask(task.id);
  };

  const handleRemoveInterruptedTask = async (taskId: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.removeInterruptedTask(taskId);
        await loadInterruptedTasks();
      }
    } catch (error) {
      console.error('Error removing interrupted task:', error);
      alert('Error removing interrupted task');
    }
  };

  // Test interrupt function (for debugging)
  const handleTestInterrupt = async () => {
    try {
      await interruptTask();
      await loadInterruptedTasks();
    } catch (error) {
      console.error('Error interrupting task:', error);
      alert('Error interrupting task');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Workspace Card */}
        <WorkspaceCard
          state={state}
          task={task}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          currentTaskDescription={currentTaskDescription}
          setCurrentTaskDescription={setCurrentTaskDescription}
          isTaskDescriptionEditing={isTaskDescriptionEditing}
          setIsTaskDescriptionEditing={setIsTaskDescriptionEditing}
          onStartWithConfigurableTime={() => {}}
          onStopTracking={handleStopTracking}
          onStartTracking={handleStartTracking}
          onStartWithTime={handleStartWithTime}
          setIsFormVisible={setIsFormVisible}
          formatElapsedTime={formatElapsedTime}
          projects={projects}
          onCreateProject={handleCreateProject}
          customers={customers}
          onCreateCustomer={handleCreateCustomer}
        />

        {/* Test Interrupt Button */}
        {state.isTracking && (
          <div className="flex justify-center mb-4">
            <Button 
              onClick={handleTestInterrupt}
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              🔧 TEST: Interrupt Current Task
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Interrupted Tasks */}
        <InterruptedTaskCard
          interruptedTasks={interruptedTasks}
          onCompleteTask={handleCompleteInterruptedTask}
          onResumeTask={handleResumeInterruptedTask}
          onRemoveTask={handleRemoveInterruptedTask}
        />

        {/* Recent Tasks Card */}
        <RecentTasksCard
          recentTasks={recentTasks}
          inlineEditingTask={inlineEditingTask}
          inlineEditValue={inlineEditValue}
          setInlineEditValue={setInlineEditValue}
          onResumeTask={handleResumeTask}
          onEditTask={handleEditTask}
          onInlineEditStart={handleInlineEditStart}
          onInlineEditSave={handleInlineEditSave}
          onInlineEditCancel={handleInlineEditCancel}
        />

        {/* Task Form Modal */}
        {isFormVisible && (
          <TaskForm
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            taskDescription={taskDescription}
            setTaskDescription={setTaskDescription}
            isFormVisible={isFormVisible}
            setIsFormVisible={setIsFormVisible}
            onStartTracking={handleStartTracking}
          />
        )}

        {/* Task Edit Modal */}
        <TaskEditModal
          task={editingTask}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />



        {/* Project Create Modal */}
        <ProjectCreateModal
          isOpen={isProjectCreateModalOpen}
          onClose={() => setIsProjectCreateModalOpen(false)}
          onCreateProject={handleProjectCreate}
          customers={customers}
          onCreateCustomer={handleCreateCustomer}
        />

        {/* Customer Create Modal */}
        <CustomerModal
          open={isCustomerCreateModalOpen}
          onOpenChange={setIsCustomerCreateModalOpen}
          onSave={handleCustomerCreate}
        />
      </div>
    </div>
  );
};

export default Dashboard; 