import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { TrackingProvider } from './contexts/TrackingContext';
import { SettingsProvider } from './contexts/SettingsContext';
import SidebarNavigation from './components/SidebarNavigation';
import Dashboard from './pages/dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <TrackingProvider>
      <SettingsProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <SidebarNavigation />
          <main className="flex-1 overflow-auto md:ml-0">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </SettingsProvider>
    </TrackingProvider>
  );
}

export default App; 