import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { TrackingProvider } from './contexts/TrackingContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <SettingsProvider>
      <TrackingProvider>
        <div className="app">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </TrackingProvider>
    </SettingsProvider>
  );
}

export default App; 