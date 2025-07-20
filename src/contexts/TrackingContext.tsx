import React, { createContext, useContext, useState, useEffect } from 'react';

interface TrackingStatus {
  isTracking: boolean;
  currentTask?: any;
  startTime?: Date;
  elapsedTime: number;
  isIdle: boolean;
}

interface TrackingContextType {
  status: TrackingStatus;
  startTracking: (taskId: number) => Promise<void>;
  stopTracking: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<TrackingStatus>({
    isTracking: false,
    elapsedTime: 0,
    isIdle: false
  });

  const startTracking = async (taskId: number) => {
    try {
      if (!window.electronAPI) {
        throw new Error('electronAPI not available');
      }
      await window.electronAPI.startTracking(taskId);
      await refreshStatus();
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  };

  const stopTracking = async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('electronAPI not available');
      }
      await window.electronAPI.stopTracking();
      await refreshStatus();
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };

  const refreshStatus = async () => {
    try {
      if (!window.electronAPI) {
        console.warn('electronAPI not available yet');
        return;
      }
      const currentStatus = await window.electronAPI.getTrackingStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Error refreshing status:', error);
    }
  };

  useEffect(() => {
    // Wait for electronAPI to be available
    const initTracking = () => {
      if (window.electronAPI) {
        refreshStatus();

        // Set up event listeners
        window.electronAPI.onTrackingUpdate((data: any) => {
          setStatus(data);
        });

        window.electronAPI.onIdleStateChange((isIdle: boolean) => {
          setStatus(prev => ({ ...prev, isIdle }));
        });
      } else {
        // Retry after a short delay
        setTimeout(initTracking, 100);
      }
    };

    initTracking();

    // Update elapsed time every second when tracking
    const interval = setInterval(() => {
      if (status.isTracking && status.startTime) {
        const elapsed = Math.floor((Date.now() - status.startTime.getTime()) / 1000);
        setStatus(prev => ({ ...prev, elapsedTime: elapsed }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TrackingContext.Provider value={{ status, startTracking, stopTracking, refreshStatus }}>
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