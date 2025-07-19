import React, { useState, useEffect } from 'react';
import { useTracking } from '../contexts/TrackingContext';
import ProjectManager from '../components/ProjectManager';
import TaskForm from '../components/TaskForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Square, Clock } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  color: string;
  notionDatabaseId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

const Dashboard: React.FC = () => {
  const { state, startTracking, stopTracking, formatElapsedTime } = useTracking();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [stats, setStats] = useState({
    todayTime: 0,
    completedTasks: 0,
    activeProjects: 0,
    productivity: 0
  });

  // Load statistics
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      if (window.electronAPI) {
        const [todayTime, completedTasks, activeProjects] = await Promise.all([
          window.electronAPI.getTotalTimeToday(),
          window.electronAPI.getCompletedTasksCount(),
          window.electronAPI.getActiveProjectsCount()
        ]);

        // Calculate productivity (hours worked today / 8 hours target)
        const hoursWorked = todayTime / 3600;
        const productivity = Math.min(Math.round((hoursWorked / 8) * 100), 100);

        setStats({
          todayTime,
          completedTasks,
          activeProjects,
          productivity
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleStartTracking = () => {
    if (!selectedProject || !taskDescription.trim()) {
      alert('Veuillez sélectionner un projet et saisir une description de tâche');
      return;
    }

    startTracking(taskDescription.trim(), selectedProject.id);
    setIsFormVisible(false);
  };

  const handleStopTracking = async () => {
    try {
      await stopTracking();
      // Reload stats after stopping tracking
      await loadStats();
    } catch (error) {
      console.error('Error stopping tracking:', error);
      alert('Erreur lors de l\'arrêt du suivi');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tableau de bord</h1>
        <p className="text-gray-600 dark:text-gray-400">Gérez votre temps de travail et suivez vos projets</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/80" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Temps total aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatTime(stats.todayTime)}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Heures</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Tâches terminées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.completedTasks}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Tâches</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Projets actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.activeProjects}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Projets</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Productivité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.productivity}%</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Section */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-green-500 to-yellow-500" />
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Suivi du temps</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            {state.isTracking ? 'Suivi en cours' : 'Prêt à commencer'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {state.isTracking && state.currentTask && (
            <div className="bg-gray-100/50 border border-gray-200 rounded-lg p-6 text-center relative dark:bg-gray-800/50 dark:border-gray-700">
              <div className="absolute top-4 left-4 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Tâche en cours</h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">{state.currentTask.description}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Projet: {selectedProject?.name || 'Projet inconnu'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Temps écoulé:</span>
                <span className="text-2xl font-mono font-bold text-blue-600 bg-white px-4 py-2 rounded-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  {formatElapsedTime()}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            {!state.isTracking ? (
              <Button 
                size="lg"
                onClick={() => setIsFormVisible(true)}
                className="min-w-[200px]"
              >
                <Play className="w-4 h-4 mr-2" />
                Démarrer le suivi
              </Button>
            ) : (
              <Button 
                variant="destructive"
                size="lg"
                onClick={handleStopTracking}
                className="min-w-[200px]"
              >
                <Square className="w-4 h-4 mr-2" />
                Arrêter le suivi
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Form Modal */}
      {isFormVisible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nouvelle tâche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Projet</label>
                <ProjectManager
                  selectedProject={selectedProject}
                  onProjectSelect={setSelectedProject}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Description de la tâche
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Décrivez ce que vous allez faire..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setIsFormVisible(false)}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleStartTracking}
                  disabled={!selectedProject || !taskDescription.trim()}
                >
                  Démarrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 