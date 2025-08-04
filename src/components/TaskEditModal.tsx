import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X, Clock, Calendar, DollarSign, Plus, Archive } from 'lucide-react';
import { Task, Project, Tag } from '@/main/database';
import ProjectDropdown from './ProjectDropdown';
import TagModal from './TagModal';

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Partial<Task> & { id: string }) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  projects: Project[];
  tags: Tag[];
  onCreateProject: () => void;
  onCreateTag: () => void;
  onTagSave: (tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  projects,
  tags,
  onCreateProject,
  onCreateTag,
  onTagSave
}) => {
  const [formData, setFormData] = useState({
    description: '',
    startTime: '',
    endTime: '',
    startDate: '',
    isPaid: false,
    isArchived: false,
    tags: ''
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  useEffect(() => {
    if (task) {
      const startDate = new Date(task.startTime);
      const endDate = task.endTime ? new Date(task.endTime) : new Date();
      
      // Find the project for this task
      const project = projects.find(p => p.id === task.projectId) || null;
      setSelectedProject(project);
      
      // Format time with seconds for proper accuracy
      const formatTimeWithSeconds = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      };

      // Validate and log the original task times for debugging
      console.log('Original task times:', {
        startTime: task.startTime,
        endTime: task.endTime,
        duration: task.duration,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      setFormData({
        description: task.description,
        startTime: formatTimeWithSeconds(startDate),
        endTime: formatTimeWithSeconds(endDate),
        startDate: startDate.toISOString().split('T')[0],
        isPaid: task.isPaid,
        isArchived: task.isArchived,
        tags: task.tags || ''
      });
    }
  }, [task, projects]);

  const handleSave = async () => {
    if (!task) return;
    
    setIsLoading(true);
    try {
      // Parse time strings with seconds properly
      const parseTimeString = (timeStr: string) => {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0;
        return { hours, minutes, seconds };
      };

      const startTime = parseTimeString(formData.startTime);
      const endTime = parseTimeString(formData.endTime);
      
      // Create proper Date objects with seconds
      const startDateTime = new Date(formData.startDate);
      startDateTime.setHours(startTime.hours, startTime.minutes, startTime.seconds, 0);
      
      const endDateTime = new Date(formData.startDate);
      endDateTime.setHours(endTime.hours, endTime.minutes, endTime.seconds, 0);
      
      // Ensure end time is after start time
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
      
      const duration = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000);
      
      const updatedTask: Partial<Task> & { id: string } = {
        id: task.id,
        description: formData.description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: duration > 0 ? duration : undefined,
        isPaid: formData.isPaid,
        isArchived: formData.isArchived,
        tags: formData.tags
      };

      // Update project if changed
      if (selectedProject && selectedProject.id !== task.projectId) {
        updatedTask.projectId = selectedProject.id;
        updatedTask.projectName = selectedProject.name;
        updatedTask.projectColor = selectedProject.color;
        updatedTask.customerId = selectedProject.customerId;
        updatedTask.customerName = selectedProject.customerName;
      }
      
      await onSave(updatedTask);
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

  const handleProjectSelect = (project: Project | null) => {
    setSelectedProject(project);
  };

  const handleTagToggle = (tagName: string) => {
    const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
    const isSelected = currentTags.includes(tagName);
    
    let newTags: string[];
    if (isSelected) {
      newTags = currentTags.filter(tag => tag !== tagName);
    } else {
      newTags = [...currentTags, tagName];
    }
    
    setFormData(prev => ({
      ...prev,
      tags: newTags.join(', ')
    }));
  };

  const handleCreateTag = () => {
    setShowTagModal(true);
    setEditingTag(null);
  };

  const handleTagSave = async (tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => {
    await onTagSave(tagData);
    setShowTagModal(false);
  };

  // Helper function to ensure time format includes seconds
  const ensureTimeFormat = (timeStr: string) => {
    if (!timeStr) return '';
    
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      // If only HH:MM, add seconds
      return `${timeStr}:00`;
    }
    return timeStr;
  };

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime || !formData.startDate) return 0;
    
    try {
      // Parse time strings with seconds properly
      const parseTimeString = (timeStr: string) => {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0;
        return { hours, minutes, seconds };
      };

      const startTime = parseTimeString(formData.startTime);
      const endTime = parseTimeString(formData.endTime);
      
      // Create proper Date objects with seconds
      const startDateTime = new Date(formData.startDate);
      startDateTime.setHours(startTime.hours, startTime.minutes, startTime.seconds, 0);
      
      const endDateTime = new Date(formData.startDate);
      endDateTime.setHours(endTime.hours, endTime.minutes, endTime.seconds, 0);
      
      // Ensure end time is after start time
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
      
      return Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000);
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 0;
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !task) return null;

  const currentDuration = calculateDuration();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto !p-0">
          <DialogHeader className='!grid !grid-cols-3 !gap-0 border-b p-3'>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Edit Task
            </DialogTitle>
              <Badge variant='premium' size="lg" className='mx-auto font-bold'>
                {formatDuration(currentDuration)}
              </Badge>
          </DialogHeader>

          <div className="space-y-4 p-3">
            {/* Task Description */}
         
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What were you working on?"
                rows={3}
              />

     

              <ProjectDropdown
              className='w-full !border border-slate-200 rounded-lg'
                selectedProject={selectedProject}
                onProjectSelect={handleProjectSelect}
                projects={projects.filter(p => !p.isArchived)}
                onCreateProject={onCreateProject}
              />
            {/* Date and Time Selection */}

   
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                                      <Input
                      id="startTime"
                      type="time"
                      step="2"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        startTime: ensureTimeFormat(e.target.value)
                      }))}
                    />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                                      <Input
                      id="endTime"
                      type="time"
                      step="2"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endTime: ensureTimeFormat(e.target.value)
                      }))}
                    />
                </div>
              </div>

     

            {/* Tags Selection */}
            <div className="space-y-0">
                      <div className="flex justify-between items-center h-6">
                        <Label>Tags</Label>
                        <Button variant="link" size="sm" className='text-xs !p-0' onClick={handleCreateTag}>
                          Add new Tag
                        </Button>
                      </div>
              <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[60px] bg-gray-100">
                {tags.filter(tag => !tag.isArchived).map((tag) => {
                  const isSelected = formData.tags
                    ? formData.tags.split(',').map(t => t.trim()).includes(tag.name)
                    : false;
                  
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      size="md"
                      className="cursor-pointer hover:scale-105 transition-all h-7"
                      style={{
                        backgroundColor: isSelected ? tag.color : undefined,
                        color: isSelected ? 'white' : undefined,
                        borderColor: tag.color
                      }}
                      onClick={() => handleTagToggle(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
                {tags.filter(tag => !tag.isArchived).length === 0 && (
                  <span className="text-sm text-gray-500">No tags available</span>
                )}
              </div>
              
            </div>

            {/* Status Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPaid" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Mark as Paid
                </Label>
                <Switch
                  id="isPaid"
                  checked={formData.isPaid}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPaid: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isArchived" className="flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  Archive Task
                </Label>
                <Switch
                  id="isArchived"
                  checked={formData.isArchived}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isArchived: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className='p-3 border-t'>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              Delete
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !formData.description.trim() || !selectedProject}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Modal */}
      <TagModal
        open={showTagModal}
        onOpenChange={setShowTagModal}
        tag={editingTag}
        onSave={handleTagSave}
      />
    </>
  );
};

export default TaskEditModal; 