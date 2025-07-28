import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  BarChart3
} from 'lucide-react';

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  console.log(location.pathname);
  
  const isHomeActive = location.pathname === '/' || location.pathname === '/dashboard';
  
  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-full max-w-sm bg-black/70 shadow-lg backdrop-blur-sm rounded-full ">
      <nav className="flex justify-between items-center p-1">
        <NavLink 
          to="/" 
          className={({ isActive }) => {
            const active = isActive || isHomeActive;
            return `flex-1 flex justify-center p-3 rounded-full transition-all duration-200 ${
              active 
                ? 'text-blue-50 bg-blue-900' 
                : 'text-slate-400 hover:text-slate-100'
            }`;
          }}
        >
          <Home className="w-5 h-5" />
        </NavLink>

        <NavLink 
          to="/reports" 
          className={({ isActive }) => 
            `flex-1 flex justify-center p-3 rounded-full transition-all duration-200 ${
              isActive 
                ? 'text-blue-50 bg-blue-900' 
                : 'text-slate-400 hover:text-slate-100'
            }`
          }
        >
          <BarChart3 className="w-5 h-5" />
        </NavLink>

        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `flex-1 flex justify-center p-3 rounded-full transition-all duration-200 ${
              isActive 
                ? 'text-blue-50 bg-blue-900' 
                : 'text-slate-400 hover:text-slate-100'
            }`
          }
        >
          <Settings className="w-5 h-5" />
        </NavLink>
      </nav>
    </div>
  );
};

export default BottomNavigation; 