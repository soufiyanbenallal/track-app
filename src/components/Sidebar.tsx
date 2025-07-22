import React from 'react';
import { NavLink } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  Settings, 
  Clock,
  BarChart3
} from 'lucide-react';

const Sidebar: React.FC = () => {

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