import React from 'react';
import { Button } from '@/components/ui/button';
import { Card,  CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Play, Edit2 } from 'lucide-react';
import { Task } from '@/main/database';

interface RecentTasksCardProps {
  recentTasks: Task[];
  inlineEditingTask: string | null;
  inlineEditValue: string;
  setInlineEditValue: (value: string) => void;
  onResumeTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onInlineEditStart: (task: Task) => void;
  onInlineEditSave: (task: Task) => void;
  onInlineEditCancel: () => void;
}

const RecentTasksCard: React.FC<RecentTasksCardProps> = ({
  recentTasks,
  inlineEditingTask,
  inlineEditValue,
  setInlineEditValue,
  onResumeTask,
  onEditTask,
  onInlineEditStart,
  onInlineEditSave,
  onInlineEditCancel
}) => {
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
    if (diffDays <= 3) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent pt-5">
          Recent Tasks
        </CardTitle>

      </CardHeader>
      <div>
        {recentTasks.length > 0 ? (
          <div className="divide-y">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-4 py-1 hover:bg-slate-100 transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: task.projectColor || '#3b82f6' }}
                  />
                  <div className="flex-1 min-w-0">
                    {inlineEditingTask === task.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={inlineEditValue}
                          onChange={(e) => setInlineEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onInlineEditSave(task);
                            } else if (e.key === 'Escape') {
                              onInlineEditCancel();
                            }
                          }}
                          className="flex-1 px-2 py-0 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onInlineEditSave(task)}
                          className="h-6 w-6 p-0"
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={onInlineEditCancel}
                          className="h-6 w-6 p-0"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <p 
                        className="font-medium text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => onInlineEditStart(task)}
                        title="Click to edit"
                      >
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span>{task.customerName || 'No customer'}</span>
                      <span>•</span>
                      <span>{task.projectName || 'No project'}</span>
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
                <div className="flex items-center gap-2 ml-4">
              
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditTask(task)}
                    className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onResumeTask(task)}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600"
                  >
                    <Play className="w-4 h-4 " />
                  </Button>
                </div>
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
      </div>
    </Card>
  );
};

export default RecentTasksCard; 