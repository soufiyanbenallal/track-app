import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TrackingState {
  isTracking: boolean;
  currentTask: {
    id: string;
    description: string;
    projectId: string;
    startTime: string;
  } | null;
  elapsedTime: number;
  isIdle: boolean;
}

type TrackingAction =
  | { type: 'START_TRACKING'; payload: { description: string; projectId: string } }
  | { type: 'STOP_TRACKING' }
  | { type: 'UPDATE_ELAPSED_TIME'; payload: number }
  | { type: 'SET_IDLE'; payload: boolean }
  | { type: 'RESET' };

const initialState: TrackingState = {
  isTracking: false,
  currentTask: null,
  elapsedTime: 0,
  isIdle: false,
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
          startTime: new Date().toISOString(),
        },
        elapsedTime: 0,
        isIdle: false,
      };
    case 'STOP_TRACKING':
      return {
        ...state,
        isTracking: false,
        currentTask: null,
        elapsedTime: 0,
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
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface TrackingContextType {
  state: TrackingState;
  startTracking: (description: string, projectId: string) => void;
  stopTracking: () => Promise<void>;
  formatElapsedTime: () => string;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(trackingReducer, initialState);

  const startTracking = useCallback((description: string, projectId: string) => {
    dispatch({ type: 'START_TRACKING', payload: { description, projectId } });
  }, []);

  const stopTracking = useCallback(async () => {
    if (state.currentTask && state.elapsedTime > 0) {
      try {
        // Save the completed task to the database
        if (window.electronAPI) {
          const taskData = {
            id: state.currentTask.id,
            description: state.currentTask.description,
            projectId: state.currentTask.projectId,
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
  }, [state.currentTask, state.elapsedTime]);

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
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        dispatch({ type: 'UPDATE_ELAPSED_TIME', payload: elapsed });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isTracking, state.currentTask, state.isIdle]);

  // Listen for Electron events
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onStartTracking(() => {
        // This will be handled by the UI components
      });

      window.electronAPI.onStopTracking(() => {
        stopTracking();
      });

      window.electronAPI.onUserIdle(() => {
        dispatch({ type: 'SET_IDLE', payload: true });
      });

      window.electronAPI.onUserActive(() => {
        dispatch({ type: 'SET_IDLE', payload: false });
      });
    }
  }, [stopTracking]);

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

export function useTracking() {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
} 