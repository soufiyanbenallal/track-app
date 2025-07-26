import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface IdleDialogProps {
  isOpen: boolean;
  onChoice: (choice: number) => void;
  initialIdleTime: number;
  currentTaskDescription?: string;
}

export function IdleDialog({ isOpen, onChoice, initialIdleTime, currentTaskDescription }: IdleDialogProps) {
  const [currentIdleTime, setCurrentIdleTime] = useState(initialIdleTime);

  useEffect(() => {
    if (!isOpen) return;

    // Update idle time every second
    const interval = setInterval(async () => {
      try {
        const idleTimeSeconds = await window.electronAPI.getCurrentIdleTime();
        setCurrentIdleTime(idleTimeSeconds);
      } catch (error) {
        console.error('Error getting current idle time:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset idle time when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIdleTime(initialIdleTime);
    }
  }, [isOpen, initialIdleTime]);

  const formatIdleTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatIdleTimeText = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}${remainingSeconds > 0 ? ` and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}` : ''}`;
    }
    return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xl font-semibold">
                You've been idle for {formatIdleTimeText(currentIdleTime)}.
              </div>
              <div className="text-sm text-gray-600">
                You have been idle since {new Date(Date.now() - currentIdleTime * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-3xl font-mono font-bold text-blue-600">
                {formatIdleTime(currentIdleTime)}
              </div>
              {currentTaskDescription && (
                <div className="text-sm text-gray-600 text-center">
                  Running time entry:<br />
                  <span className="font-medium">{currentTaskDescription}</span>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-3 mt-6">
          <Button
            onClick={() => onChoice(1)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            Discard idle time and continue
          </Button>
          <Button
            onClick={() => onChoice(0)}
            variant="outline"
            className="w-full"
          >
            Keep idle time and continue
          </Button>
          <Button
            onClick={() => onChoice(2)}
            variant="outline"
            className="w-full"
          >
            Stop and save session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 