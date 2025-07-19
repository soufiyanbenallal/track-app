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
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Track App</h1>
        <p className="text-sm text-muted-foreground">Gestion du temps</p>
      </div>

      {/* Current Task Display */}
      {state.currentTask && (
        <div className="p-4 border-b border-border">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full bg-primary"
              />
              <span className="text-sm font-medium text-foreground">
                Projet actuel
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {state.currentTask.description}
            </p>
            {state.isTracking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>En cours...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tracking Controls */}
      {state.currentTask && (
        <div className="p-4 border-b border-border">
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
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`
          }
        >
          <Settings className="w-4 h-4" />
          Paramètres
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          Track App v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 