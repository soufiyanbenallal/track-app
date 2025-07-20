import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import ProjectManager from '../components/ProjectManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  MessageSquare, 
  ExternalLink, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings as SettingsIcon
} from 'lucide-react';

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

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          Paramètres
        </h1>
        <p className="text-muted-foreground">Configurez votre application de suivi du temps</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres généraux</CardTitle>
          <CardDescription>Configurez le comportement de base de l'application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <Label className="text-base font-medium">Temps d'inactivité</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Le suivi sera automatiquement mis en pause après cette durée d'inactivité
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={idleTimeout}
                  onChange={(e: { target: { value: string; }; }) => setIdleTimeout(parseInt(e.target.value) || 5)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <Label className="text-base font-medium">Synchronisation automatique</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Synchronise automatiquement les tâches terminées avec Notion
              </p>
              <div className="flex items-center gap-3">
                <Switch
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                />
                <span className="text-sm text-muted-foreground">
                  {autoSync ? 'Activé' : 'Désactivé'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notion Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Intégration Notion</CardTitle>
          <CardDescription>Connectez votre application à Notion pour synchroniser vos données</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">Clé API Notion</Label>
              <p className="text-sm text-muted-foreground">
                Votre clé API pour l'intégration avec Notion
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={notionApiKey}
                  onChange={(e: { target: { value: any; }; }) => setNotionApiKey(e.target.value)}
                  placeholder="Entrez votre clé API Notion"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://www.notion.so/my-integrations', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Obtenir
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">ID de l'espace de travail</Label>
              <p className="text-sm text-muted-foreground">
                L'ID de votre espace de travail Notion
              </p>
              <Input
                type="text"
                value={notionWorkspaceId}
                onChange={(e: { target: { value: any; }; }) => setNotionWorkspaceId(e.target.value)}
                placeholder="Entrez l'ID de votre espace de travail"
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleTestNotionConnection}
              disabled={testingConnection || !notionApiKey}
            >
              {testingConnection ? 'Test en cours...' : 'Tester la connexion'}
            </Button>
            <div className="flex items-center gap-2">
              {getConnectionStatusIcon()}
              <span className="text-sm text-muted-foreground">
                {getConnectionStatusText()}
              </span>
            </div>
          </div>

          {notionDatabases.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-muted-foreground" />
                  <Label className="text-base font-medium">Bases de données disponibles</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bases de données Notion accessibles
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {notionDatabases.map((db: { title: any; }, index: any) => (
                    <Badge key={index} variant="secondary" className="justify-start">
                      {db.title}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Project Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion des projets</CardTitle>
          <CardDescription>Créez et gérez vos projets de suivi du temps</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectManager  />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} size="lg">
          Sauvegarder les paramètres
        </Button>
      </div>
    </div>
  );
};

export default Settings; 