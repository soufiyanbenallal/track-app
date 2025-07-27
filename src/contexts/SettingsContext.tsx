import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  idleTimeoutMinutes: number;
  notionApiKey?: string;
  notionWorkspaceId?: string;
  autoSyncToNotion: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  testNotionConnection: () => Promise<boolean>;
  getNotionDatabases: () => Promise<any[]>;
}

const defaultSettings: Settings = {
  idleTimeoutMinutes: 5,
  autoSyncToNotion: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Component for Fast Refresh compatibility
function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      if (window.electronAPI) {
        const savedSettings = await window.electronAPI.getSettings();
        const loadedSettings = { ...defaultSettings, ...savedSettings };
        setSettings(loadedSettings);
        
        // Set the Notion API key if it exists
        if (loadedSettings.notionApiKey) {
          await window.electronAPI.setNotionApiKey(loadedSettings.notionApiKey);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      if (window.electronAPI) {
        await window.electronAPI.updateSettings(updatedSettings);
        
        // If Notion API key is being updated, set it in the Notion service
        if (newSettings.notionApiKey) {
          await window.electronAPI.setNotionApiKey(newSettings.notionApiKey);
        }
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const testNotionConnection = async (): Promise<boolean> => {
    if (!settings.notionApiKey) return false;
    
    try {
      if (window.electronAPI) {
        // Set the API key first
        await window.electronAPI.setNotionApiKey(settings.notionApiKey);
        // Then test the connection
        return await window.electronAPI.testNotionConnection();
      }
      return false;
    } catch (error) {
      console.error('Notion connection test failed:', error);
      return false;
    }
  };

  const getNotionDatabases = async (): Promise<any[]> => {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.getNotionDatabases();
      }
      return [];
    } catch (error) {
      console.error('Error fetching Notion databases:', error);
      return [];
    }
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    testNotionConnection,
    getNotionDatabases,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook for Fast Refresh compatibility
function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Export both functions at the end for better Fast Refresh compatibility
export { SettingsProvider, useSettings }; 