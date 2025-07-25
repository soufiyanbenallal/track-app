import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { TrackingProvider } from './contexts/TrackingContext';
import { SettingsProvider } from './contexts/SettingsContext';
import BottomNavigation from './components/BottomNavigation';
import Dashboard from './pages/dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <TrackingProvider>
      <SettingsProvider>
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      
          
          <main className="flex-1 overflow-auto pb-16">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
          <BottomNavigation />
        </div>
      </SettingsProvider>
    </TrackingProvider>
  );
}

export default App; 