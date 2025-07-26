import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProjectDropdown from '../../../components/ProjectDropdown';
import CustomerDropdown from '../../../components/CustomerDropdown';
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
}

interface WorkspaceCardProps {
  state: TrackingState;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  currentTaskDescription: string;
  setCurrentTaskDescription: (description: string) => void;
  isTaskDescriptionEditing: boolean;
  setIsTaskDescriptionEditing: (editing: boolean) => void;
  onStartWithConfigurableTime: () => void;
  onStopTracking: () => void;
  onStartTracking: () => void;
  setIsFormVisible: (visible: boolean) => void;
  formatElapsedTime: () => string;
  projects: Project[];
  onCreateProject: () => void;
  customers: Customer[];
  onCreateCustomer: () => void;
}

export default function WorkspaceCard({
  state,
  selectedProject,
  setSelectedProject,
  selectedCustomer,
  setSelectedCustomer,
  currentTaskDescription,
  setCurrentTaskDescription,
  isTaskDescriptionEditing,
  setIsTaskDescriptionEditing,
  onStartWithConfigurableTime,
  onStopTracking,
  onStartTracking,
  setIsFormVisible,
  formatElapsedTime,
  projects,
  onCreateProject,
  customers,
  onCreateCustomer
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
                  />
                  <CustomerDropdown
                    selectedCustomer={selectedCustomer}
                    onCustomerSelect={setSelectedCustomer}
                    customers={customers}
                    onCreateCustomer={onCreateCustomer}
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
                
              <div className="text-xl font-bold text-slate-900 bg-slate-700/20 px-4 h-10 flex items-center justify-center rounded-xl min-w-32">
                {isTracking ? formatElapsedTime() : '00:00:00'}
              </div>
              {
                isTracking ? (
                  <Button
                    size="lg"
                    onClick={()=>{
                      onStopTracking();
                      setIsTaskDescriptionEditing(true);
                      setCurrentTaskDescription('');
                    }}
                    className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700"
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                ) : (<Button
                  size="lg"
                  onClick={onStartWithConfigurableTime}
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
