import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';

interface TimeEditHoverPopoverProps {
  isTracking: boolean;
  currentStartTime?: string;
  onTimeChange: (startTime: string) => void;
  getDisplayTime: () => string;
  children: React.ReactNode;
}

const TimeEditHoverPopover: React.FC<TimeEditHoverPopoverProps> = ({
  isTracking,
  currentStartTime,
  onTimeChange,
  getDisplayTime,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startTime, setStartTime] = useState('');

  // Initialize time values
  useEffect(() => {
    if (isTracking && currentStartTime) {
      // Show the fixed start time if already tracking
      const date = new Date(currentStartTime);
      const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      setStartTime(timeString);
    } else {
      // Show current time if not tracking
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setStartTime(timeString);
    }
  }, [isTracking, currentStartTime, isOpen]);

  const handleTimeChange = (value: string) => {
    setStartTime(value);
    
    // Convert time to ISO string and notify parent
    const [hours, minutes] = value.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
      onTimeChange(startDate.toISOString());
    }
  };

  const handleTimeIncrement = (increment: boolean) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    
    let newHours = hours;
    let newMinutes = minutes;
    
    if (increment) {
      newMinutes += 1;
      if (newMinutes >= 60) {
        newMinutes = 0;
        newHours += 1;
      }
    } else {
      newMinutes -= 1;
      if (newMinutes < 0) {
        newMinutes = 59;
        newHours -= 1;
      }
    }
    
    if (newHours >= 24) newHours = 0;
    if (newHours < 0) newHours = 23;
    
    const newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    handleTimeChange(newTime);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className="cursor-pointer hover:bg-slate-600/20 rounded-lg transition-colors"
          onClick={() => setIsOpen(true)}
        >
          {children}
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-4 bg-slate-800/95 backdrop-blur-sm border-slate-600 shadow-xl"
        align="center"
        sideOffset={0}
      
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">
              {isTracking ? 'Tracking Started At' : 'Set Start Time'}
            </h3>
          </div>

          {/* Current display time */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">
                {isTracking ? 'Current Duration' : 'Will Show'}
              </div>
              <div className="text-lg font-mono text-white">{getDisplayTime()}</div>
              <div className="text-xs text-slate-400 mt-1">
                {isTracking ? `Started at ${startTime}` : `From ${startTime} to now`}
              </div>
            </div>
          </div>

          {/* Start Time Input */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-300">
              {isTracking ? 'Start Time (Fixed)' : 'Start Time'}
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={startTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className={`text-center font-mono text-lg bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500 ${
                  isTracking ? 'cursor-not-allowed opacity-60' : ''
                }`}
                autoFocus={false}
                placeholder="HH:MM"
                disabled={isTracking}
              />
              {!isTracking && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTimeIncrement(true)}
                    className="h-4 w-4 p-0 hover:bg-slate-600 text-slate-300"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTimeIncrement(false)}
                    className="h-4 w-4 p-0 hover:bg-slate-600 text-slate-300"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {!isTracking && (
            <div className="text-xs text-slate-400 text-center">
              Use the regular Start button to begin tracking with this time
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TimeEditHoverPopover; 