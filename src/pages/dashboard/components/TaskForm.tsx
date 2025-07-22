import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectManager from '../../../components/ProjectManager';

interface Project {
  id: string;
  name: string;
  color: string;
  notionDatabaseId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TaskFormProps {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  taskDescription: string;
  setTaskDescription: (description: string) => void;
  isFormVisible: boolean;
  setIsFormVisible: (visible: boolean) => void;
  onStartTracking: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  selectedProject,
  setSelectedProject,
  taskDescription,
  setTaskDescription,
  isFormVisible,
  setIsFormVisible,
  onStartTracking
}) => {
  if (!isFormVisible) return null;

  return (
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
              onClick={onStartTracking}
              disabled={!selectedProject || !taskDescription.trim()}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskForm; 