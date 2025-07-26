import React from 'react';
import { Check, Play, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Task } from '@/main/database';

interface InterruptedTaskCardProps {
  interruptedTasks: Task[];
  onCompleteTask: (taskId: string) => void;
  onResumeTask: (task: Task) => void;
  onRemoveTask: (taskId: string) => void;
}

const InterruptedTaskCard: React.FC<InterruptedTaskCardProps> = ({
  interruptedTasks,
  onCompleteTask,
  onResumeTask,
  onRemoveTask,
}) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (interruptedTasks.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          Interrupted Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {interruptedTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-orange-200 dark:border-orange-700 shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {task.projectColor && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.projectColor }}
                  />
                )}
                <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  {task.projectName || 'Unknown Project'}
                </span>
                {task.customerName && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    • {task.customerName}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                {task.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {task.duration ? formatDuration(task.duration) : '00:00:00'}
                </span>
                <span className="text-xs text-orange-600 dark:text-orange-400">
                  • Interrupted
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCompleteTask(task.id)}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/20"
                title="Mark as completed"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResumeTask(task)}
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/20"
                title="Resume task"
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveTask(task.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                title="Remove task"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default InterruptedTaskCard; 