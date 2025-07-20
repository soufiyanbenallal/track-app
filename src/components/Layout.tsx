import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, ListTodo, FolderOpen, BarChart3, Settings, Play, Square } from 'lucide-react';
import { useTracking } from '@/contexts/TrackingContext';
import { formatDuration } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: Clock },
  { name: 'Tâches', href: '/tasks', icon: ListTodo },
  { name: 'Projets', href: '/projects', icon: FolderOpen },
  { name: 'Rapports', href: '/reports', icon: BarChart3 },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { status, startTracking, stopTracking } = useTracking();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-foreground">TrackApp</h1>
        </div>
        
        {/* Tracking Status */}
        {status.isTracking && (
          <div className="px-6 py-4 border-b border-border">
            <div className="bg-primary/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary">
                  En cours de suivi
                </span>
                <button
                  onClick={() => stopTracking()}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Square size={16} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {status.currentTask?.description}
              </p>
              <p className="text-lg font-mono text-primary">
                {formatDuration(status.elapsedTime)}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-6">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {navigation.find(item => item.href === location.pathname)?.name || 'TrackApp'}
            </h2>
            
            {/* Quick Start Button */}
            {!status.isTracking && (
              <button
                onClick={() => {
                  // This would open a quick start dialog
                  console.log('Quick start tracking');
                }}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Play className="mr-2 h-4 w-4" />
                Démarrer
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 