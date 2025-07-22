import React from 'react';

interface Stats {
  todayTime: number;
  completedTasks: number;
  activeProjects: number;
  productivity: number;
}

interface StatsGridProps {
  stats: Stats;
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ul className="grid grid-cols-4 bg-slate-950 text-white rounded-lg divide-x divide-white/20 ">
      <li className='p-2'>
            <p className='text-xs'>Today's Time</p>
            <b className='font-bold'>

            {formatTime(stats.todayTime)}
            </b>
      </li>
      <li className='p-2'>
          <p className='text-xs'>Completed Tasks</p>
          <b className='font-bold'>

            {stats.completedTasks}
          </b>
      </li>

      <li className='p-2'>
            <p className='text-xs'>Active Projects</p>
            <b className='font-bold'>

            {stats.activeProjects}
            </b>
      </li>

      <li className='p-2'>
            <p className='text-xs'>Productivity</p>
            <b className='font-bold'>

            {stats.productivity}%
            </b>
      </li>
    </ul>
  );
};

export default StatsGrid; 