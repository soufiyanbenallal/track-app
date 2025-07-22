import React, { useState, useEffect } from 'react';
import { useTracking } from '../contexts/TrackingContext';
import ProjectManager from '../components/ProjectManager';
import TaskForm from '../components/TaskForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Square, Clock, RotateCcw } from 'lucide-react';

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

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTaskDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTaskDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
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

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {state.isTracking ? 'Active tracking' : 'Ready to work'}
            </span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Manage your work time and track your projects with precision
          </p>
        </div>

        {/* Stats Grid - Smaller */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Today's Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {formatTime(stats.todayTime)}
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Completed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                {stats.completedTasks}
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {stats.activeProjects}
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Productivity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {stats.productivity}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks Section */}
        <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Recent Tasks
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-400">
              Resume previous tasks or start new ones
            </p>
          </CardHeader>
          <CardContent>
            {recentTasks.length > 0 ? (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: task.projectColor || '#3b82f6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <span>{task.projectName}</span>
                          <span>•</span>
                          <span>{formatTaskDate(task.startTime)}</span>
                          {task.duration && (
                            <>
                              <span>•</span>
                              <span>{formatTaskDuration(task.duration)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResumeTask(task)}
                      className="ml-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent tasks found</p>
                <p className="text-sm">Start tracking your first task to see it here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracking Section */}
        <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-orange-500" />
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Time Tracking
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {state.isTracking ? 'Tracking in progress' : 'Ready to start'}
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {state.isTracking && state.currentTask && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500" />
                <div className="absolute top-6 left-6 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-green-500/10 rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-blue-500/10 rounded-full" />
                
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 text-xl">Current Task</h3>
                <p className="text-lg text-slate-700 dark:text-slate-300 mb-3 font-medium">{state.currentTask.description}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Project: <span className="font-semibold">{selectedProject?.name || 'Unknown Project'}</span>
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Elapsed time:</span>
                  <span className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 bg-white/80 dark:bg-slate-800/80 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg backdrop-blur-sm">
                    {formatElapsedTime()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              {!state.isTracking ? (
                <Button 
                  size="lg"
                  onClick={() => setIsFormVisible(true)}
                  className="min-w-[250px] h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="w-5 h-5 mr-3" />
                  Start Tracking
                </Button>
              ) : (
                <Button 
                  variant="destructive"
                  size="lg"
                  onClick={handleStopTracking}
                  className="min-w-[250px] h-14 text-lg font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Square className="w-5 h-5 mr-3" />
                  Stop Tracking
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Form Modal */}
        {isFormVisible && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-lg bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-2xl animate-in zoom-in-95 duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  New Task
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Project</label>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <ProjectManager
                      selectedProject={selectedProject}
                      onProjectSelect={setSelectedProject}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Task Description
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Describe what you're going to do..."
                    rows={4}
                    className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                </div>

                <div className="flex gap-4 justify-end pt-6">
                  <Button 
                    variant="outline"
                    onClick={() => setIsFormVisible(false)}
                    className="px-6 py-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleStartTracking}
                    disabled={!selectedProject || !taskDescription.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 