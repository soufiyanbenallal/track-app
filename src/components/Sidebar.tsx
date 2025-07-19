import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  FileText, 
  Settings, 
  Play, 
  Square, 
  Clock,
  BarChart3
} from 'lucide-react';
import { useTracking } from '@/contexts/TrackingContext';

const Sidebar: React.FC = () => {
  const { state, startTracking, stopTracking } = useTracking();

  const handleStartTracking = () => {
    if (state.currentTask) {
      startTracking(state.currentTask.description, state.currentTask.projectId);
    }
  };

  const handleStopTracking = () => {
    stopTracking();
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Track App</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Gestion du temps</p>
      </div>

      {/* Current Task Display */}
      {state.currentTask && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full bg-blue-600"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Projet actuel
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {state.currentTask.description}
            </p>
            {state.isTracking && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>En cours...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tracking Controls */}
      {state.currentTask && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            {!state.isTracking ? (
              <Button 
                onClick={handleStartTracking} 
                className="w-full"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Démarrer
              </Button>
            ) : (
              <Button 
                onClick={handleStopTracking} 
                variant="destructive"
                className="w-full"
                size="sm"
              >
                <Square className="w-4 h-4 mr-2" />
                Arrêter
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700'
            }`
          }
        >
          <Home className="w-4 h-4" />
          Tableau de bord
        </NavLink>

        <NavLink 
          to="/reports" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700'
            }`
          }
        >
          <BarChart3 className="w-4 h-4" />
          Rapports & Journal
        </NavLink>

        <Separator className="my-4" />

        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700'
            }`
          }
        >
          <Settings className="w-4 h-4" />
          Paramètres
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Track App v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 