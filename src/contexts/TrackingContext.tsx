import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { IdleDialog } from '@/components/IdleDialog';

interface TrackingState {
  isTracking: boolean;
  currentTask: {
    id: string;
    description: string;
    projectId: string;
    customerId?: string;
    startTime: string;
    initialDuration?: number;
  } | null;
  elapsedTime: number;
  isIdle: boolean;
  currentInterruptedTaskId: string | null;
}

type TrackingAction =
  | { type: 'START_TRACKING'; payload: { description: string; projectId: string; customerId?: string; startTime?: string; initialDuration?: number } }
  | { type: 'STOP_TRACKING' }
  | { type: 'UPDATE_ELAPSED_TIME'; payload: number }
  | { type: 'SET_IDLE'; payload: boolean }
  | { type: 'SET_INTERRUPTED_TASK_ID'; payload: string | null }
  | { type: 'RESET' }
  | { type: 'INTERRUPT_TASK' };

const initialState: TrackingState = {
  isTracking: false,
  currentTask: null,
  elapsedTime: 0,
  isIdle: false,
  currentInterruptedTaskId: null,
};

function trackingReducer(state: TrackingState, action: TrackingAction): TrackingState {
  switch (action.type) {
    case 'START_TRACKING':
      return {
        ...state,
        isTracking: true,
        currentTask: {
          id: Date.now().toString(),
          description: action.payload.description,
          projectId: action.payload.projectId,
          customerId: action.payload.customerId,
          startTime: action.payload.startTime || new Date().toISOString(),
          initialDuration: action.payload.initialDuration || 0,
        },
        elapsedTime: action.payload.initialDuration || 0,
        isIdle: false,
        currentInterruptedTaskId: null,
      };
    case 'STOP_TRACKING':
      return {
        ...state,
        isTracking: false,
        currentTask: null,
        elapsedTime: 0,
        currentInterruptedTaskId: null,
      };
    case 'UPDATE_ELAPSED_TIME':
      return {
        ...state,
        elapsedTime: action.payload,
      };
    case 'SET_IDLE':
      return {
        ...state,
        isIdle: action.payload,
      };
    case 'SET_INTERRUPTED_TASK_ID':
      return {
        ...state,
        currentInterruptedTaskId: action.payload,
      };
    case 'INTERRUPT_TASK':
      return {
        ...state,
        isTracking: false,
        currentTask: null,
        elapsedTime: 0,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface TrackingContextType {
  state: TrackingState;
  startTracking: (description: string, projectId: string, customerId?: string, startTime?: string, initialDuration?: number) => void;
  stopTracking: () => Promise<void>;
  interruptTask: () => Promise<void>;
  formatElapsedTime: () => string;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

function TrackingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(trackingReducer, initialState);
  const [showIdleDialog, setShowIdleDialog] = useState(false);
  const [idleDialogTime, setIdleDialogTime] = useState(0);
  const [rememberedIdleStartTime, setRememberedIdleStartTime] = useState<Date | null>(null);
  
  // Refs to access latest values in event handlers
  const stateRef = useRef(state);
  const stopTrackingRef = useRef<(() => Promise<void>) | null>(null);

  // Update refs when values change
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const startTracking = useCallback((description: string, projectId: string, customerId?: string, startTime?: string, initialDuration?: number) => {
    dispatch({ type: 'START_TRACKING', payload: { description, projectId, customerId, startTime, initialDuration } });
  }, []);

  const interruptTask = useCallback(async () => {
    if (state.currentTask && state.elapsedTime > 0) {
      try {
        // Save current task as interrupted
        const interruptedTask = await window.electronAPI.saveInterruptedTask({
          description: state.currentTask.description,
          projectId: state.currentTask.projectId,
          customerId: state.currentTask.customerId,
          startTime: state.currentTask.startTime,
          endTime: new Date().toISOString(),
          duration: state.elapsedTime,
        });
        
        console.log('Task interrupted and saved:', interruptedTask);
      } catch (error) {
        console.error('Error saving interrupted task:', error);
      }
    }
    
    dispatch({ type: 'INTERRUPT_TASK' });
  }, [state.currentTask, state.elapsedTime]);

  const stopTracking = useCallback(async () => {
    if (state.currentTask && state.elapsedTime > 0) {
      try {
        // Clean up any interrupted task for this session
        if (state.currentInterruptedTaskId) {
          await window.electronAPI.removeInterruptedTask(state.currentInterruptedTaskId);
        }
        
        // Save the completed task to the database
        if (window.electronAPI) {
          const taskData = {
            id: state.currentTask.id,
            description: state.currentTask.description,
            projectId: state.currentTask.projectId,
            customerId: state.currentTask.customerId,
            startTime: state.currentTask.startTime,
            endTime: new Date().toISOString(),
            duration: state.elapsedTime,
            isCompleted: true,
            isPaid: false,
            isArchived: false,
            isInterrupted: false
          };
          
          const savedTask = await window.electronAPI.createTask(taskData);
          
          // Auto-sync to Notion if enabled
          try {
            const settings = await window.electronAPI.getSettings();
            if (settings.autoSyncToNotion && settings.notionApiKey) {
              // Get project information for Notion sync
              const projects = await window.electronAPI.getProjects();
              const project = projects.find((p: any) => p.id === state.currentTask?.projectId);
              
              console.log('🔍 Auto-sync check:', {
                autoSyncEnabled: settings.autoSyncToNotion,
                hasApiKey: !!settings.notionApiKey,
                projectId: state.currentTask?.projectId,
                projectFound: !!project,
                projectName: project?.name,
                hasNotionDb: !!project?.notionDatabaseId
              });
              
              if (project && project.notionDatabaseId) {
                await window.electronAPI.syncTask(savedTask, project);
                console.log('✅ Task successfully synced to Notion:', project.name);
              } else if (project && !project.notionDatabaseId) {
                console.log('⚠️  Project found but no Notion database linked. Configure Notion database in project settings to enable sync:', project.name);
              } else {
                console.log('❌ Project not found for sync. Project ID:', state.currentTask?.projectId);
              }
            }
          } catch (notionError) {
            console.error('Error syncing task to Notion:', notionError);
            // Don't throw - we don't want Notion sync errors to break task saving
          }
        }
      } catch (error) {
        console.error('Error saving task:', error);
      }
    }
    
    dispatch({ type: 'STOP_TRACKING' });
  }, [state.currentTask, state.elapsedTime, state.currentInterruptedTaskId]);

  // Update stopTracking ref
  useEffect(() => {
    stopTrackingRef.current = stopTracking;
  }, [stopTracking]);

  const formatElapsedTime = useCallback(() => {
    const elapsed = state.elapsedTime;
    
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [state.elapsedTime]);

  // Update elapsed time every second when tracking
  useEffect(() => {
    if (!state.isTracking || state.isIdle) return;

    const interval = setInterval(() => {
      if (state.currentTask) {
        const startTime = new Date(state.currentTask.startTime);
        const now = new Date();
        const actualElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const totalElapsed = (state.currentTask.initialDuration || 0) + actualElapsed;
        dispatch({ type: 'UPDATE_ELAPSED_TIME', payload: totalElapsed });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isTracking, state.currentTask, state.isIdle]);

  // Auto-save to interrupted tasks every 30 seconds
  useEffect(() => {
    if (!state.isTracking || !state.currentTask || state.elapsedTime === 0) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        if (state.currentInterruptedTaskId) {
          // Update existing interrupted task
          await window.electronAPI.updateInterruptedTask(state.currentInterruptedTaskId, {
            duration: state.elapsedTime,
            endTime: new Date().toISOString(),
          });
        } else if (state.currentTask) {
          // Create new interrupted task
          const interruptedTask = await window.electronAPI.saveInterruptedTask({
            description: state.currentTask.description,
            projectId: state.currentTask.projectId,
            customerId: state.currentTask.customerId,
            startTime: state.currentTask.startTime,
            endTime: new Date().toISOString(),
            duration: state.elapsedTime,
          });
          
          if (interruptedTask?.id) {
            dispatch({ type: 'SET_INTERRUPTED_TASK_ID', payload: interruptedTask.id });
          }
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [state.isTracking, state.currentTask, state.elapsedTime, state.currentInterruptedTaskId]);

  const handleIdleDialogChoice = useCallback(async (choice: number, finalIdleTime: number) => {
    setShowIdleDialog(false);
    
    try {
      switch (choice) {
        case 0: // Keep idle time and continue
          // Resume idle detection
          await window.electronAPI.resumeIdleDetection();
          dispatch({ type: 'SET_IDLE', payload: false });
          break;
        case 1: // Discard idle time and continue
          if (stateRef.current.currentTask && rememberedIdleStartTime) {
            // Calculate the actual idle duration that should be discarded
            const idleSeconds = Math.floor(finalIdleTime);
            
            // Adjust the task start time to account for discarded idle time
            const currentTask = stateRef.current.currentTask;
            const originalStartTime = new Date(currentTask.startTime);
            const adjustedStartTime = new Date(originalStartTime.getTime() + (idleSeconds * 1000));
            
            // Update the current task with the new start time
            dispatch({ 
              type: 'START_TRACKING', 
              payload: { 
                ...currentTask,
                startTime: adjustedStartTime.toISOString(),
                initialDuration: currentTask.initialDuration || 0
              }
            });
            
            // Recalculate elapsed time without the idle period
            const now = new Date();
            const actualElapsed = Math.floor((now.getTime() - adjustedStartTime.getTime()) / 1000);
            const totalElapsed = (currentTask.initialDuration || 0) + actualElapsed;
            dispatch({ type: 'UPDATE_ELAPSED_TIME', payload: Math.max(0, totalElapsed) });
          }
          // Resume idle detection
          await window.electronAPI.resumeIdleDetection();
          dispatch({ type: 'SET_IDLE', payload: false });
          break;
        case 2: // Stop and save session
          // Don't include the idle time when stopping
          if (stateRef.current.currentTask && rememberedIdleStartTime) {
            const idleSeconds = Math.floor(finalIdleTime);
            const adjustedElapsedTime = Math.max(0, stateRef.current.elapsedTime - idleSeconds);
            dispatch({ type: 'UPDATE_ELAPSED_TIME', payload: adjustedElapsedTime });
          }
          // Resume idle detection before stopping
          await window.electronAPI.resumeIdleDetection();
          if (stopTrackingRef.current) {
            await stopTrackingRef.current();
          }
          break;
        default:
          // Resume idle detection
          await window.electronAPI.resumeIdleDetection();
          dispatch({ type: 'SET_IDLE', payload: false });
          break;
      }
    } catch (error) {
      console.error('Error handling idle dialog choice:', error);
      // Always resume idle detection on error
      await window.electronAPI.resumeIdleDetection();
      dispatch({ type: 'SET_IDLE', payload: false });
    }
    
    // Reset remembered start time
    setRememberedIdleStartTime(null);
  }, [rememberedIdleStartTime]);

  // Listen for Electron events - run only once on mount
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleStartTracking = () => {
      // This will be handled by the UI components
    };

    const handleStopTracking = () => {
      // Use a ref to access latest stopTracking function
      if (stopTrackingRef.current) {
        stopTrackingRef.current();
      }
    };

    const handleUserIdle = async (data: { idleTime: number }) => {
      // Use refs to access latest state
      if (!stateRef.current.isTracking) return;
      
      dispatch({ type: 'SET_IDLE', payload: true });
      
      // Pause idle detection so mouse movement doesn't reset the timer
      await window.electronAPI.pauseIdleDetection();
      
      // Remember when the idle period started
      const idleStartTime = new Date(Date.now() - (data.idleTime * 1000));
      setRememberedIdleStartTime(idleStartTime);
      
      // Show custom idle dialog
      setIdleDialogTime(data.idleTime);
      setShowIdleDialog(true);
    };

    const handleUserActive = () => {
      dispatch({ type: 'SET_IDLE', payload: false });
    };

    // Add event listeners
    window.electronAPI.onStartTracking(handleStartTracking);
    window.electronAPI.onStopTracking(handleStopTracking);
    window.electronAPI.onUserIdle(handleUserIdle);
    window.electronAPI.onUserActive(handleUserActive);

    // Cleanup function to remove event listeners
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeStartTracking(handleStartTracking);
        window.electronAPI.removeStopTracking(handleStopTracking);
        window.electronAPI.removeUserIdle(handleUserIdle);
        window.electronAPI.removeUserActive(handleUserActive);
      }
    };
  }, []); // Empty dependency array - run only once

  const value: TrackingContextType = {
    state,
    startTracking,
    stopTracking,
    interruptTask,
    formatElapsedTime,
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
      <IdleDialog
        isOpen={showIdleDialog}
        onChoice={handleIdleDialogChoice}
        initialIdleTime={idleDialogTime}
        currentTaskDescription={state.currentTask?.description}
        rememberedStartTime={rememberedIdleStartTime}
      />
    </TrackingContext.Provider>
  );
}

// Hook for Fast Refresh compatibility
function useTracking() {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}

// Export both functions at the end for better Fast Refresh compatibility
export { TrackingProvider, useTracking }; 