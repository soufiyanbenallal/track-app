import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import ProjectManager from '../components/ProjectManager';
import './Settings.css';

const Settings: React.FC = () => {
  const { settings, updateSettings, testNotionConnection, getNotionDatabases } = useSettings();
  const [notionApiKey, setNotionApiKey] = useState(settings.notionApiKey || '');
  const [notionWorkspaceId, setNotionWorkspaceId] = useState(settings.notionWorkspaceId || '');
  const [idleTimeout, setIdleTimeout] = useState(settings.idleTimeoutMinutes);
  const [autoSync, setAutoSync] = useState(settings.autoSyncToNotion);
  const [notionDatabases, setNotionDatabases] = useState<any[]>([]);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (settings.notionApiKey) {
      loadNotionDatabases();
    }
  }, [settings.notionApiKey]);

  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        notionApiKey,
        notionWorkspaceId,
        idleTimeoutMinutes: idleTimeout,
        autoSyncToNotion: autoSync,
      });
      alert('Paramètres sauvegardés avec succès');
    } catch (error) {
      alert('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleTestNotionConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      const isConnected = await testNotionConnection();
      setConnectionStatus(isConnected ? 'success' : 'error');
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  const loadNotionDatabases = async () => {
    try {
      const databases = await getNotionDatabases();
      setNotionDatabases(databases);
    } catch (error) {
      console.error('Error loading Notion databases:', error);
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'success':
        return 'Connexion réussie';
      case 'error':
        return 'Échec de la connexion';
      default:
        return 'Non testé';
    }
  };

  const getConnectionStatusClass = () => {
    switch (connectionStatus) {
      case 'success':
        return 'status-success';
      case 'error':
        return 'status-error';
      default:
        return 'status-idle';
    }
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1 className="settings-title">Paramètres</h1>
        <p className="settings-subtitle">Configurez votre application de suivi du temps</p>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2>Paramètres généraux</h2>
          
          <div className="settings-grid">
            <div className="setting-item">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                Temps d'inactivité
              </h3>
              <p>Le suivi sera automatiquement mis en pause après cette durée d'inactivité</p>
              <div className="setting-control">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={idleTimeout}
                  onChange={(e) => setIdleTimeout(parseInt(e.target.value) || 5)}
                />
                <span>minutes</span>
              </div>
            </div>

            <div className="setting-item">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Synchronisation automatique
              </h3>
              <p>Synchronise automatiquement les tâches terminées avec Notion</p>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span>{autoSync ? 'Activé' : 'Désactivé'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Intégration Notion</h2>
          
          <div className="settings-grid">
            <div className="setting-item">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10,17 15,12 10,7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Clé API Notion
              </h3>
              <p>Votre clé API pour l'intégration avec Notion</p>
              <div className="setting-control">
                <input
                  type="password"
                  value={notionApiKey}
                  onChange={(e) => setNotionApiKey(e.target.value)}
                  placeholder="Entrez votre clé API Notion"
                />
                <button className="btn btn-secondary btn-sm" onClick={() => window.open('https://www.notion.so/my-integrations', '_blank')}>
                  Obtenir
                </button>
              </div>
            </div>

            <div className="setting-item">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                ID de l'espace de travail
              </h3>
              <p>L'ID de votre espace de travail Notion</p>
              <div className="setting-control">
                <input
                  type="text"
                  value={notionWorkspaceId}
                  onChange={(e) => setNotionWorkspaceId(e.target.value)}
                  placeholder="Entrez l'ID de votre espace de travail"
                />
              </div>
            </div>
          </div>

          <div className="setting-control" style={{ marginTop: 'var(--spacing-lg)' }}>
            <button 
              className="btn btn-secondary"
              onClick={handleTestNotionConnection}
              disabled={testingConnection || !notionApiKey}
            >
              {testingConnection ? 'Test en cours...' : 'Tester la connexion'}
            </button>
            <div className={`connection-status ${connectionStatus === 'success' ? 'connected' : connectionStatus === 'error' ? 'disconnected' : 'idle'}`}>
              <div className="status-indicator"></div>
              {getConnectionStatusText()}
            </div>
          </div>

          {notionDatabases.length > 0 && (
            <div className="setting-item" style={{ marginTop: 'var(--spacing-lg)' }}>
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
                Bases de données disponibles
              </h3>
              <p>Bases de données Notion accessibles</p>
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                {notionDatabases.map((db, index) => (
                  <div key={index} style={{ 
                    padding: 'var(--spacing-sm)', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: '0.875rem'
                  }}>
                    {db.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="settings-section">
          <h2>Gestion des projets</h2>
          <ProjectManager />
        </div>

        <div className="settings-actions">
          <button className="btn btn-primary" onClick={handleSaveSettings}>
            Sauvegarder les paramètres
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 