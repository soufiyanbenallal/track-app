import React, { useState, useEffect } from 'react';
import { useTracking } from '../../contexts/TrackingContext';
import TaskEditModal from '../../components/TaskEditModal';
import TimeEditPopover from '../../components/TimeEditPopover';
import StatsGrid from './components/StatsGrid';
import WorkspaceCard from './components/WorkspaceCard';
import RecentTasksCard from './components/RecentTasksCard';
import TaskForm from './components/TaskForm';

interface Project {
  id: string;
  name: string;
  color: string;
  notionDatabaseId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  description: string;
  projectId: string;
  projectName?: string;
  projectColor?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  isCompleted: boolean;
  isPaid: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

const Dashboard: React.FC = () => {
  const { state, startTracking, stopTracking, formatElapsedTime } = useTracking();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [inlineEditingTask, setInlineEditingTask] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState('');
  const [isTimeEditOpen, setIsTimeEditOpen] = useState(false);
  const [currentTaskDescription, setCurrentTaskDescription] = useState('');
  const [isTaskDescriptionEditing, setIsTaskDescriptionEditing] = useState(false);
  const [stats, setStats] = useState({
    todayTime: 0,
    completedTasks: 0,
    activeProjects: 0,
    productivity: 0
  });

  // Load statistics and recent tasks
  useEffect(() => {
    loadStats();
    loadRecentTasks();
  }, []);

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
      }
    } catch (error) {
      console.error('Error loading recent tasks:', error);
    }
  };

  const handleStartTracking = () => {
    if (!selectedProject || !taskDescription.trim()) {
      alert('Please select a project and enter a task description');
      return;
    }

    startTracking(taskDescription.trim(), selectedProject.id);
    setIsFormVisible(false);
  };

  const handleResumeTask = (task: Task) => {
    // Start tracking directly with the task details
    startTracking(task.description, task.projectId);
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

  const handleTimeEditSave = (startTime: string, endTime: string, date: string) => {
    // Convert the time and date to ISO string and start tracking
    const [day, month, year] = date.split('/');
    const [startHour, startMinute] = startTime.split(':');
    const [endHour, endMinute] = endTime.split(':');
    
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(startHour), parseInt(startMinute));
    const endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(endHour), parseInt(endMinute));
    
    // Start tracking with the configured time
    if (currentTaskDescription.trim()) {
      startTracking(currentTaskDescription.trim(), selectedProject?.id || '');
    }
  };

  const handleStartWithConfigurableTime = () => {
    if (!selectedProject || !currentTaskDescription.trim()) {
      alert('Please select a project and enter a task description');
      return;
    }
    setIsTimeEditOpen(true);
  };

  const handleStopTracking = async () => {
    try {
      await stopTracking();
      // Reload stats and recent tasks after stopping tracking
      await Promise.all([loadStats(), loadRecentTasks()]);
    } catch (error) {
      console.error('Error stopping tracking:', error);
      alert('Error stopping tracking');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Workspace Card */}
        <WorkspaceCard
          state={state}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          currentTaskDescription={currentTaskDescription}
          setCurrentTaskDescription={setCurrentTaskDescription}
          isTaskDescriptionEditing={isTaskDescriptionEditing}
          setIsTaskDescriptionEditing={setIsTaskDescriptionEditing}
          onStartWithConfigurableTime={handleStartWithConfigurableTime}
          onStopTracking={handleStopTracking}
          onStartTracking={handleStartTracking}
          setIsFormVisible={setIsFormVisible}
          formatElapsedTime={formatElapsedTime}
        />

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

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

        {/* Time Edit Popover */}
        <TimeEditPopover
          isOpen={isTimeEditOpen}
          onClose={() => setIsTimeEditOpen(false)}
          onSave={handleTimeEditSave}
          initialStartTime="19:51"
          initialEndTime="20:52"
          initialDate="22/7/2025"
        />
      </div>
    </div>
  );
};

export default Dashboard; 