import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronUp, ChevronDown, ArrowRight, X } from 'lucide-react';

interface TimeEditPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startTime: string, endTime: string, date: string) => void;
  initialStartTime?: string;
  initialEndTime?: string;
  initialDate?: string;
}

const TimeEditPopover: React.FC<TimeEditPopoverProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStartTime = '19:51',
  initialEndTime = '20:52',
  initialDate = '22/7/2025'
}) => {
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [date, setDate] = useState(initialDate);
  const [selectedField, setSelectedField] = useState<'start' | 'end' | 'date' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
      setDate(initialDate);
    }
  }, [isOpen, initialStartTime, initialEndTime, initialDate]);

  const handleTimeChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      setStartTime(value);
    } else {
      setEndTime(value);
    }
  };

  const handleTimeIncrement = (field: 'start' | 'end', increment: boolean) => {
    const currentTime = field === 'start' ? startTime : endTime;
    const [hours, minutes] = currentTime.split(':').map(Number);
    
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
    handleTimeChange(field, newTime);
  };

  const handleSave = () => {
    onSave(startTime, endTime, date);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-slate-800/95 backdrop-blur-sm border-0 shadow-2xl rounded-xl">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Edit Time</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-slate-700 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Time Range */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              {/* Start Time */}
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    value={startTime}
                    onChange={(e) => handleTimeChange('start', e.target.value)}
                    onFocus={() => setSelectedField('start')}
                    className={`text-center font-mono text-lg bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500 ${
                      selectedField === 'start' ? 'ring-2 ring-blue-500' : ''
                    }`}
                    placeholder="HH:MM"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTimeIncrement('start', true)}
                      className="h-4 w-4 p-0 hover:bg-slate-600 text-slate-300"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTimeIncrement('start', false)}
                      className="h-4 w-4 p-0 hover:bg-slate-600 text-slate-300"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="text-slate-400 w-5 h-5" />

              {/* End Time */}
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    value={endTime}
                    onChange={(e) => handleTimeChange('end', e.target.value)}
                    onFocus={() => setSelectedField('end')}
                    className={`text-center font-mono text-lg bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500 ${
                      selectedField === 'end' ? 'ring-2 ring-blue-500' : ''
                    }`}
                    placeholder="HH:MM"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTimeIncrement('end', true)}
                      className="h-4 w-4 p-0 hover:bg-slate-600 text-slate-300"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTimeIncrement('end', false)}
                      className="h-4 w-4 p-0 hover:bg-slate-600 text-slate-300"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="relative">
              <Input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onFocus={() => setSelectedField('date')}
                className={`text-center font-mono text-lg bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500 ${
                  selectedField === 'date' ? 'ring-2 ring-blue-500' : ''
                }`}
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeEditPopover; 