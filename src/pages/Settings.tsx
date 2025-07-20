import React, { useState } from 'react';
import { Settings as SettingsIcon, Key, Database, Bell } from 'lucide-react';

export default function Settings() {
  const [notionApiKey, setNotionApiKey] = useState('');
  const [idleThreshold, setIdleThreshold] = useState(5);
  const [notifications, setNotifications] = useState(true);

  const handleSaveSettings = () => {
    // Save settings logic would go here
    console.log('Saving settings...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">
            Configurez votre application TrackApp
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Notion Integration */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center mb-4">
            <Key className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold text-foreground">
              Intégration Notion
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Clé API Notion
              </label>
              <input
                type="password"
                value={notionApiKey}
                onChange={(e) => setNotionApiKey(e.target.value)}
                placeholder="Entrez votre clé API Notion"
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Obtenez votre clé API depuis les paramètres de votre intégration Notion
              </p>
            </div>
            
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Tester la connexion
            </button>
          </div>
        </div>

        {/* Idle Detection */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold text-foreground">
              Détection d'inactivité
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Seuil d'inactivité (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={idleThreshold}
                onChange={(e) => setIdleThreshold(Number(e.target.value))}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Le suivi du temps sera automatiquement mis en pause après cette durée d'inactivité
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold text-foreground">
              Notifications
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Notifications de suivi</h3>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications lors du démarrage/arrêt du suivi
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center mb-4">
            <Database className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold text-foreground">
              Base de données
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Emplacement de la base de données</h3>
                <p className="text-sm text-muted-foreground">
                  ~/.trackapp/trackapp.db
                </p>
              </div>
              <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                Changer
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Sauvegarde automatique</h3>
                <p className="text-sm text-muted-foreground">
                  Sauvegarder automatiquement les données
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
              Exporter les données
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Sauvegarder les paramètres
          </button>
        </div>
      </div>
    </div>
  );
} 