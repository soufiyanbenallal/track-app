import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import ProjectManager from '../components/ProjectManager';
import CustomerManager from '../components/CustomerManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  MessageSquare, 
  ExternalLink, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings as SettingsIcon,
  FolderOpen,
  Users
} from 'lucide-react';

const Settings: React.FC = () => {
  const { settings, updateSettings, testNotionConnection, getNotionDatabases } = useSettings();
  const [notionApiKey, setNotionApiKey] = useState(settings.notionApiKey || '');
  const [notionWorkspaceId, setNotionWorkspaceId] = useState(settings.notionWorkspaceId || '');
  const [idleTimeout, setIdleTimeout] = useState(settings.idleTimeoutMinutes);
  const [notionDatabases, setNotionDatabases] = useState<any[]>([]);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (settings.notionApiKey) {
      loadNotionDatabases();
    }
  }, [settings.notionApiKey]);

  // Sync local state with settings when they are loaded
  useEffect(() => {
    setNotionApiKey(settings.notionApiKey || '');
    setNotionWorkspaceId(settings.notionWorkspaceId || '');
    setIdleTimeout(settings.idleTimeoutMinutes || 5);
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        notionApiKey,
        notionWorkspaceId,
        idleTimeoutMinutes: idleTimeout,
        autoSyncToNotion: false, // Always false since auto-sync is disabled
      });
      alert('Settings saved successfully');
    } catch (error) {
      alert('Error saving settings');
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
        return 'Connection successful';
      case 'error':
        return 'Connection failed';
      default:
        return 'Not tested';
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
          Settings
        </h1>
        <p className="text-muted-foreground">Configure your time tracking application</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure the basic behavior of the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <Label className="text-base font-medium">Idle Timeout</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Tracking will be automatically paused after this period of inactivity
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
                <Label className="text-base font-medium">Manual Sync</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Notion sync is now manual. Use the "Submit to Notion" button on the Reports page to sync all completed tasks.
              </p>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  Manual Only
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notion Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Notion Integration</CardTitle>
          <CardDescription>Connect your application to Notion for manual data synchronization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">Notion API Key</Label>
                <Badge variant="secondary" className="text-xs">
                  Required
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your API key for Notion integration. Get it from your Notion integrations page.
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={notionApiKey}
                  onChange={(e: { target: { value: any; }; }) => setNotionApiKey(e.target.value)}
                  placeholder="Enter your Notion API key"
                  disabled={false}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://www.notion.so/my-integrations', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Workspace ID</Label>
              <p className="text-sm text-muted-foreground">
                The ID of your Notion workspace
              </p>
              <Input
                type="text"
                value={notionWorkspaceId}
                onChange={(e: { target: { value: any; }; }) => setNotionWorkspaceId(e.target.value)}
                placeholder="Enter your workspace ID"
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
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
            <div className="flex items-center gap-2">
              {getConnectionStatusIcon()}
              <span className="text-sm text-muted-foreground">
                {getConnectionStatusText()}
              </span>
            </div>
          </div>

          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              <Label className="text-base font-medium">Manual Sync</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              After configuring your Notion API key, use the "Submit to Notion" button on the Reports page to manually sync all completed tasks to your Notion database.
            </p>
          </div>

          {notionDatabases.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-muted-foreground" />
                  <Label className="text-base font-medium">Available Databases</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Accessible Notion databases
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

      {/* Project and Customer Management */}
      <Card>
        <CardHeader>
          <CardTitle>Project and Customer Management</CardTitle>
          <CardDescription>Create and manage your time tracking projects and customers</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Customers
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="projects" className="mt-6">
              <ProjectManager />
            </TabsContent>
            
            <TabsContent value="customers" className="mt-6">
              <CustomerManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings; 