import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ProjectManager from '../../../components/ProjectManager';
import { Play, Square, Plus, Tag, DollarSign } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  color: string;
  notionDatabaseId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TrackingState {
  isTracking: boolean;
  currentTask: any;
  elapsedTime: number;
  isIdle: boolean;
}

interface WorkspaceCardProps {
  state: TrackingState;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  currentTaskDescription: string;
  setCurrentTaskDescription: (description: string) => void;
  isTaskDescriptionEditing: boolean;
  setIsTaskDescriptionEditing: (editing: boolean) => void;
  onStartWithConfigurableTime: () => void;
  onStopTracking: () => void;
  onStartTracking: () => void;
  setIsFormVisible: (visible: boolean) => void;
  formatElapsedTime: () => string;
}

export  default function WorkspaceCardProps   ({
  state,
  selectedProject,
  setSelectedProject,
  currentTaskDescription,
  setCurrentTaskDescription,
  isTaskDescriptionEditing,
  setIsTaskDescriptionEditing,
  onStartWithConfigurableTime,
  onStopTracking,
  onStartTracking,
  setIsFormVisible,
  formatElapsedTime
}: WorkspaceCardProps) {
  const isTracking = useMemo(() => {
    return state.isTracking && state.currentTask;
  }, [state.isTracking, state.currentTask]);

  const isPaused = useMemo(() => {
    return state.isTracking && !state.currentTask;
  }, [state.isTracking, state.currentTask]);

  const isIdle = useMemo(() => {
    return !state.isTracking && !state.currentTask;
  }, [state.isTracking, state.currentTask]);


      
  return (

      <div className="space-y-6 border-b border-gray-300">
        {/* state.isTracking && state.currentTask  */}
       
          {/* // New task input view */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-white text-xl">
                🍅
              </div>
              <div className="flex-1">
                {isTaskDescriptionEditing ? (
                  <Input
                    value={currentTaskDescription}
                    onChange={(e) => setCurrentTaskDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsTaskDescriptionEditing(false);
                      } else if (e.key === 'Escape') {
                        setIsTaskDescriptionEditing(false);
                        setCurrentTaskDescription('');
                      }
                    }}
                    placeholder="What are you working on?"
                    className="!text-xl border-0 bg-transparent focus:ring-0 shadow-none "
                    autoFocus
                  />
                ) : (
                  <p 
                    className="text-lg font-medium text-slate-900 dark:text-slate-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => setIsTaskDescriptionEditing(true)}
                  >
                    {currentTaskDescription || 'What are you working on?'}
                  </p>
                )}
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 bg-white/80 dark:bg-slate-700/80 px-4 py-2 rounded-lg">
                0:00:00
              </div>
              {
                isTracking ? (
                  <Button
                    size="lg"
                    onClick={onStopTracking}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700"
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                ) : (<Button
                  size="lg"
                  onClick={onStartWithConfigurableTime}
                  disabled={!!currentTaskDescription.trim()}
                  className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-6 h-6" />
                </Button>
                )
              }
            </div>
          </div>
      </div>
  );
};
