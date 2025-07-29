import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProjectDropdown from '../../../components/ProjectDropdown';
// import CustomerDropdown from '../../../components/CustomerDropdown';
import TimeEditHoverPopover from '../../../components/TimeEditHoverPopover';
import { Play, Square } from 'lucide-react';
// import { Task } from '@/main/database';

interface Project {
  id: string;
  name: string;
  color: string;
  customerId?: string;
  customerName?: string;
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

interface TrackingState {
  isTracking: boolean;
  currentTask: any;
  elapsedTime: number;
  isIdle: boolean;
  isStoppingTracking: boolean;
}

interface WorkspaceCardProps {
  state: TrackingState;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  currentTaskDescription: string;
  setCurrentTaskDescription: (description: string) => void;
  isTaskDescriptionEditing: boolean;
  setIsTaskDescriptionEditing: (editing: boolean) => void;
  onStopTracking: () => void;
  onStartTracking: () => void;
  onStartWithTime: (startTime: string) => void;
  formatElapsedTime: () => string;
  projects: Project[];
  onCreateProject: () => void;
  customers: Customer[];
}

export default function WorkspaceCard({
  state,
  selectedProject,
  setSelectedProject,
  setSelectedCustomer,
  currentTaskDescription,
  setCurrentTaskDescription,
  setIsTaskDescriptionEditing,
  onStopTracking,
  onStartTracking,
  onStartWithTime,
  formatElapsedTime,
  projects,
  onCreateProject,
  customers,
}: WorkspaceCardProps) {
  const [customStartTime, setCustomStartTime] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);
  const isTracking = useMemo(() => {
    return state.isTracking && state.currentTask;
  }, [state.isTracking, state.currentTask]);

  // const isPaused = useMemo(() => {
  //   return state.isTracking && !state.currentTask;
  // }, [state.isTracking, state.currentTask]);

  // const isIdle = useMemo(() => {
  //   return !state.isTracking && !state.currentTask;
  // }, [state.isTracking, state.currentTask]);

  // Reset custom start time when tracking starts
  useEffect(() => {
    if (isTracking) {
      setCustomStartTime(null);
    }
  }, [isTracking]);

  // Update display time every second when we have a custom start time but not tracking
  useEffect(() => {
    if (!isTracking && customStartTime) {
      const interval = setInterval(() => {
        // Force re-render to update display time
        forceUpdate(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isTracking, customStartTime]);

  const getDisplayTime = () => {
    if (isTracking) {
      return formatElapsedTime();
    }
    
    // Calculate time from custom start time to now
    if (customStartTime) {
      const startTime = new Date(customStartTime);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      
      if (elapsed >= 0) {
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    
    return '00:00:00';
  };

  const handleStartClick = () => {
    if (customStartTime && selectedProject && currentTaskDescription.trim()) {
      onStartWithTime(customStartTime);
    } else {
      onStartTracking();
    }
  };
      
  return (
      <div className="pb-6 border-b border-gray-300">
        {/* state.isTracking && state.currentTask  */}
          {/* // New task input view */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 rounded-xl bg-gray-200 flex items-center divide-x h-10">

                  <ProjectDropdown
                    selectedProject={selectedProject}
                    onProjectSelect={setSelectedProject}
                    projects={projects}
                    onCreateProject={onCreateProject}
                    onCustomerChange={(customerId) => {
                      // Find customer by ID and set it
                      const customer = customers.find(c => c.id === customerId);
                      setSelectedCustomer(customer || null);
                    }}
                  />
            
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
                    className="border-0 bg-transparent focus:ring-0  rounded-r-xl rounded-l-none shadow-none "
                    autoFocus
                  />
              </div>
                
              <TimeEditHoverPopover
                isTracking={isTracking}
                currentStartTime={state.currentTask?.startTime}
                onTimeChange={setCustomStartTime}
                getDisplayTime={getDisplayTime}
              >
                <div className="text-xl font-bold text-slate-900 bg-slate-700/20 px-4 h-10 flex items-center justify-center rounded-xl min-w-32">
                  {getDisplayTime()}
                </div>
              </TimeEditHoverPopover>
              {
                isTracking ? (
                  <Button
                    size="lg"
                    onClick={()=>{
                      if (!state.isStoppingTracking) {
                        onStopTracking();
                        setIsTaskDescriptionEditing(true);
                        setCurrentTaskDescription('');
                      }
                    }}
                    disabled={state.isStoppingTracking}
                    className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.isStoppingTracking ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Square className="w-6 h-6" />
                    )}
                  </Button>
                ) : (<Button
                  size="lg"
                  onClick={handleStartClick}
                  disabled={!currentTaskDescription.trim()}
                  className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-6 h-6" />
                </Button>
                )
              }
            </div>
            
            {/* Project and Customer selectors */}
           
          </div>
      </div>
  );
};
