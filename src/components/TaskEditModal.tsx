import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X, Clock, Calendar, Tag, DollarSign } from 'lucide-react';

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

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Partial<Task> & { id: string }) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    description: '',
    startTime: '',
    endTime: '',
    isPaid: false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (task) {
      const startDate = new Date(task.startTime);
      const endDate = task.endTime ? new Date(task.endTime) : new Date();
      
      setFormData({
        description: task.description,
        startTime: startDate.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        endTime: endDate.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        isPaid: task.isPaid
      });
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;
    
    setIsLoading(true);
    try {
      const startDate = new Date(task.startTime);
      const [startHour, startMinute] = formData.startTime.split(':');
      const [endHour, endMinute] = formData.endTime.split(':');
      
      const newStartTime = new Date(startDate);
      newStartTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
      
      const newEndTime = new Date(startDate);
      newEndTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
      
      const duration = Math.floor((newEndTime.getTime() - newStartTime.getTime()) / 1000);
      
      await onSave({
        id: task.id,
        description: formData.description,
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString(),
        duration: duration > 0 ? duration : undefined,
        isPaid: formData.isPaid
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsLoading(true);
      try {
        await onDelete(task.id);
        onClose();
      } catch (error) {
        console.error('Error deleting task:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen || !task) return null;

  const taskDate = new Date(task.startTime).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 m-0">
      <Card className="w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-2xl animate-in zoom-in-95 duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Edit Task
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Task Description
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What were you working on?"
              className="w-full"
            />
          </div>

          {/* Project Info */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: task.projectColor || '#3b82f6' }}
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {task.projectName}
            </span>
            <Tag className="w-4 h-4 text-slate-400" />
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>

          {/* Duration Display */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration
            </Label>
            <div className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-700/50 px-4 py-2 rounded-lg">
              {task.duration ? formatDuration(task.duration) : '00:00:00'}
            </div>
          </div>

          {/* Time Editing */}
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Time Range
            </Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-xs text-slate-500">
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-xs text-slate-500">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="text-xs text-slate-500">
              Date: {taskDate}
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isPaid" className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Mark as Paid
            </Label>
            <Switch
              id="isPaid"
              checked={formData.isPaid}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPaid: checked }))}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1"
            >
              Delete
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !formData.description.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default TaskEditModal; 