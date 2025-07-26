import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  backupTaskId: string | null;
}

type TrackingAction =
  | { type: 'START_TRACKING'; payload: { description: string; projectId: string; customerId?: string; startTime?: string; initialDuration?: number } }
  | { type: 'STOP_TRACKING' }
  | { type: 'UPDATE_ELAPSED_TIME'; payload: number }
  | { type: 'SET_IDLE'; payload: boolean }
  | { type: 'SET_BACKUP_TASK_ID'; payload: string | null }
  | { type: 'RESET' };

const initialState: TrackingState = {
  isTracking: false,
  currentTask: null,
  elapsedTime: 0,
  isIdle: false,
  backupTaskId: null,
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
        backupTaskId: null,
      };
    case 'STOP_TRACKING':
      return {
        ...state,
        isTracking: false,
        currentTask: null,
        elapsedTime: 0,
        backupTaskId: null,
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
    case 'SET_BACKUP_TASK_ID':
      return {
        ...state,
        backupTaskId: action.payload,
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
  formatElapsedTime: () => string;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

// Component for Fast Refresh compatibility
function TrackingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(trackingReducer, initialState);

  const startTracking = useCallback((description: string, projectId: string, customerId?: string, startTime?: string, initialDuration?: number) => {
    dispatch({ type: 'START_TRACKING', payload: { description, projectId, customerId, startTime, initialDuration } });
  }, []);

  const stopTracking = useCallback(async () => {
    if (state.currentTask && state.elapsedTime > 0) {
      try {
        // Clean up backup task first
        if (state.backupTaskId) {
          await window.electronAPI.deleteTask(state.backupTaskId);
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
            isCompleted: true
          };
          
          await window.electronAPI.createTask(taskData);
        }
      } catch (error) {
        console.error('Error saving task:', error);
      }
    }
    
    dispatch({ type: 'STOP_TRACKING' });
  }, [state.currentTask, state.elapsedTime, state.backupTaskId]);

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

  // Auto-save tracking state every 10 seconds
  useEffect(() => {
    if (state.isTracking && state.currentTask) {
      const trackingState = {
        currentTask: state.currentTask,
        elapsedTime: state.elapsedTime,
        isTracking: true,
        timestamp: Date.now()
      };
      localStorage.setItem('activeTracking', JSON.stringify(trackingState));
    }
  }, [state.isTracking, state.currentTask, state.elapsedTime]);

  // Recovery on app start
  useEffect(() => {
    const savedTracking = localStorage.getItem('activeTracking');
    const unsavedTracking = localStorage.getItem('unsavedTracking');
    
    // Check for unsaved work first (from unexpected closure)
    if (unsavedTracking) {
      try {
        const parsed = JSON.parse(unsavedTracking);
        if (parsed.needsSaving) {
          const hours = Math.floor(parsed.elapsedTime / 3600);
          const minutes = Math.floor((parsed.elapsedTime % 3600) / 60);
          const seconds = parsed.elapsedTime % 60;
          const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          const shouldRecover = confirm(
            `You have unsaved work from a previous session. The app closed unexpectedly while tracking "${parsed.currentTask.description}" for ${timeString}. Do you want to recover and save this session?`
          );
          
          if (shouldRecover) {
            // Immediately save as completed task
            window.electronAPI?.createTask({
              id: parsed.currentTask.id,
              description: parsed.currentTask.description,
              projectId: parsed.currentTask.projectId,
              customerId: parsed.currentTask.customerId,
              startTime: parsed.currentTask.startTime,
              endTime: new Date(parsed.timestamp).toISOString(),
              duration: parsed.elapsedTime,
              isCompleted: true
            }).then(() => {
              console.log('Recovered unsaved session successfully');
            }).catch(console.error);
          }
        }
      } catch (error) {
        console.error('Error recovering unsaved tracking state:', error);
      }
      localStorage.removeItem('unsavedTracking');
    }
    
    // Check for normal recovery (auto-saved state)
    if (savedTracking) {
      try {
        const parsed = JSON.parse(savedTracking);
        const timeSinceLastSave = Date.now() - parsed.timestamp;
        
        // If less than 30 minutes since last save, offer recovery
        if (timeSinceLastSave < 30 * 60 * 1000) {
          const shouldRecover = confirm(
            `You have an incomplete tracking session from ${formatDistanceToNow(new Date(parsed.timestamp), { addSuffix: true, locale: fr })}. Do you want to recover it?`
          );
          
          if (shouldRecover) {
            dispatch({ 
              type: 'START_TRACKING', 
              payload: { 
                description: parsed.currentTask.description, 
                projectId: parsed.currentTask.projectId,
                customerId: parsed.currentTask.customerId,
                startTime: parsed.currentTask.startTime,
                initialDuration: parsed.currentTask.initialDuration || 0
              }
            });
            // Update with recovered elapsed time
            dispatch({ 
              type: 'UPDATE_ELAPSED_TIME', 
              payload: parsed.elapsedTime + Math.floor(timeSinceLastSave / 1000)
            });
          }
        }
      } catch (error) {
        console.error('Error recovering tracking state:', error);
      }
      // Clean up saved state
      localStorage.removeItem('activeTracking');
    }
  }, []); // Run once on mount

  // Listen for Electron events
  useEffect(() => {
    if (window.electronAPI) {
      const handleStartTracking = () => {
        // This will be handled by the UI components
      };

      const handleStopTracking = () => {
        stopTracking();
      };

      const handleUserIdle = async (data: { idleTime: number }) => {
        if (!state.isTracking) return;
        
        dispatch({ type: 'SET_IDLE', payload: true });
        
        // Show native modal immediately when idle is detected
        try {
          const choice = await window.electronAPI.showIdleDialog(data.idleTime);
          
          switch (choice) {
            case 0: // Continue tracking (keep idle time)
              dispatch({ type: 'SET_IDLE', payload: false });
              break;
            case 1: // Discard idle time and continue
              if (state.currentTask) {
                const idleSeconds = Math.floor(data.idleTime);
                const newElapsedTime = Math.max(0, state.elapsedTime - idleSeconds);
                dispatch({ type: 'UPDATE_ELAPSED_TIME', payload: newElapsedTime });
              }
              dispatch({ type: 'SET_IDLE', payload: false });
              break;
            case 2: // Stop tracking and save session
              await stopTracking();
              break;
            default:
              dispatch({ type: 'SET_IDLE', payload: false });
              break;
          }
        } catch (error) {
          console.error('Error handling idle dialog:', error);
          dispatch({ type: 'SET_IDLE', payload: false });
        }
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
    }
  }, [state.isTracking, state.currentTask, state.elapsedTime, stopTracking]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.isTracking && state.currentTask && state.elapsedTime > 0) {
        // Prevent immediate close
        event.preventDefault();
        event.returnValue = 'You have an active tracking session. Closing now will save your current progress.';
        
        // Save the current task synchronously using a different approach
        // Since we can't use async in beforeunload, we'll save to localStorage for recovery
        const trackingState = {
          currentTask: state.currentTask,
          elapsedTime: state.elapsedTime,
          isTracking: true,
          timestamp: Date.now(),
          needsSaving: true
        };
        localStorage.setItem('unsavedTracking', JSON.stringify(trackingState));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isTracking, state.currentTask, state.elapsedTime]);

  // Add backup functionality with single backup task
  useEffect(() => {
    if (!state.isTracking) return;
    
    const backupInterval = setInterval(async () => {
      if (state.currentTask && state.elapsedTime > 60) { // Only backup if > 1 minute
        try {
          if (!state.backupTaskId) {
            // Create initial backup task
            const backupTask = await window.electronAPI.saveDraftTask({
              ...state.currentTask,
              duration: state.elapsedTime,
              description: `${state.currentTask.description} (Auto-backup)`,
              endTime: new Date().toISOString()
            });
            dispatch({ type: 'SET_BACKUP_TASK_ID', payload: backupTask?.id || null });
          } else {
            // Update existing backup task
            await window.electronAPI.updateTask({
              id: state.backupTaskId,
              duration: state.elapsedTime,
              endTime: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Auto-backup failed:', error);
          dispatch({ type: 'SET_BACKUP_TASK_ID', payload: null }); // Reset to create new backup on next interval
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => {
      clearInterval(backupInterval);
    };
  }, [state.isTracking, state.currentTask, state.elapsedTime, state.backupTaskId]);

  const value: TrackingContextType = {
    state,
    startTracking,
    stopTracking,
    formatElapsedTime,
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
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