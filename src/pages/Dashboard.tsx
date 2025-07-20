import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useTracking } from '@/contexts/TrackingContext';
import { formatDuration, formatDate, getDateRange } from '@/lib/utils';
import { TaskSelectionModal } from '@/components/TaskSelectionModal';

export default function Dashboard() {
  const { projects, tasks, refreshTasks } = useData();
  const { status, startTracking, stopTracking } = useTracking();
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalHours: 0,
    paidHours: 0,
    unpaidHours: 0,
    tasksCount: 0
  });
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      const { start, end } = getDateRange(7); // Last 7 days
      await refreshTasks({ start_date: start, end_date: end });
    };

    loadDashboardData();
  }, []);

  useEffect(() => {
    // Calculate stats from tasks
    const totalHours = tasks.reduce((sum, task) => sum + (task.duration || 0), 0) / 3600;
    const paidHours = tasks
      .filter(task => task.is_paid)
      .reduce((sum, task) => sum + (task.duration || 0), 0) / 3600;
    const unpaidHours = totalHours - paidHours;

    setStats({
      totalHours,
      paidHours,
      unpaidHours,
      tasksCount: tasks.length
    });

    // Get recent tasks
    const recent = tasks
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .slice(0, 5);
    setRecentTasks(recent);
  }, [tasks]);

  const handleQuickStart = () => {
    if (status.isTracking) {
      stopTracking();
    } else {
      setShowTaskModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your time tracking activity
          </p>
        </div>
        
        <button
          onClick={handleQuickStart}
          className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
            status.isTracking
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {status.isTracking ? (
            <>
              <Square className="mr-2 h-5 w-5" />
              Stop
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Start
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total hours</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalHours.toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Paid hours</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.paidHours.toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Pending hours</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.unpaidHours.toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Tasks</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.tasksCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Tracking Status */}
      {status.isTracking && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Currently tracking
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current task</p>
              <p className="text-lg font-medium text-foreground">
                {status.currentTask?.description}
              </p>
              <p className="text-sm text-muted-foreground">
                Project: {status.currentTask?.project_name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Elapsed time</p>
              <p className="text-2xl font-mono font-bold text-primary">
                {formatDuration(status.elapsedTime)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recent tasks
        </h2>
        {recentTasks.length > 0 ? (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: task.project_color || '#3B82F6' }}
                  />
                  <div>
                    <p className="font-medium text-foreground">
                      {task.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {task.project_name} • {formatDate(task.start_time)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-foreground">
                    {formatDuration(task.duration || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.is_paid ? 'Paid' : 'Pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No recent tasks
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left">
            <h3 className="font-medium text-foreground">New task</h3>
            <p className="text-sm text-muted-foreground">
              Create a new tracking task
            </p>
          </button>
          
          <button className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left">
            <h3 className="font-medium text-foreground">New project</h3>
            <p className="text-sm text-muted-foreground">
              Create a new project
            </p>
          </button>
          
          <button className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left">
            <h3 className="font-medium text-foreground">Generate report</h3>
            <p className="text-sm text-muted-foreground">
              Create a time report
            </p>
          </button>
        </div>
      </div>

      {/* Task Selection Modal */}
      <TaskSelectionModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
      />
    </div>
  );
} 