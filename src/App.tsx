import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { TrackingProvider } from './contexts/TrackingContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <TrackingProvider>
      <SettingsProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </SettingsProvider>
    </TrackingProvider>
  );
}

export default App; 