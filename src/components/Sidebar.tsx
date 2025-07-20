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
    <div className="w-64 h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Track App
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Gestion du temps</p>
          </div>
        </div>
      </div>

      {/* Current Task Display */}
      {state.currentTask && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${state.isTracking ? 'bg-green-500 animate-pulse' : 'bg-blue-600'}`} />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {state.isTracking ? 'Tâche active' : 'Tâche en pause'}
              </span>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 font-medium">
                {state.currentTask.description}
              </p>
            </div>
            {state.isTracking && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Suivi en cours...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tracking Controls */}
      {state.currentTask && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="space-y-3">
            {!state.isTracking ? (
              <Button 
                onClick={handleStartTracking} 
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Démarrer le suivi
              </Button>
            ) : (
              <Button 
                onClick={handleStopTracking} 
                variant="destructive"
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="sm"
              >
                <Square className="w-4 h-4 mr-2" />
                Arrêter le suivi
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
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
              isActive 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
            }`
          }
        >
          <Home className="w-5 h-5" />
          Tableau de bord
        </NavLink>

        <NavLink 
          to="/reports" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
              isActive 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
            }`
          }
        >
          <BarChart3 className="w-5 h-5" />
          Rapports & Journal
        </NavLink>

        <Separator className="my-6" />

        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
              isActive 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          Paramètres
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
        <div className="text-xs text-slate-600 dark:text-slate-400 text-center font-medium">
          Track App v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 