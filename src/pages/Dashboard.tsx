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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {state.isTracking ? 'Suivi actif' : 'Prêt à travailler'}
            </span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Gérez votre temps de travail et suivez vos projets avec précision
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Temps total aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {formatTime(stats.todayTime)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Heures</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Tâches terminées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                {stats.completedTasks}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tâches</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Projets actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {stats.activeProjects}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Projets</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Productivité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {stats.productivity}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">%</p>
            </CardContent>
          </Card>
        </div>

        {/* Tracking Section */}
        <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-orange-500" />
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Suivi du temps
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {state.isTracking ? 'Suivi en cours' : 'Prêt à commencer'}
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {state.isTracking && state.currentTask && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500" />
                <div className="absolute top-6 left-6 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-green-500/10 rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-blue-500/10 rounded-full" />
                
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 text-xl">Tâche en cours</h3>
                <p className="text-lg text-slate-700 dark:text-slate-300 mb-3 font-medium">{state.currentTask.description}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Projet: <span className="font-semibold">{selectedProject?.name || 'Projet inconnu'}</span>
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Temps écoulé:</span>
                  <span className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 bg-white/80 dark:bg-slate-800/80 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg backdrop-blur-sm">
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
                  className="min-w-[250px] h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="w-5 h-5 mr-3" />
                  Démarrer le suivi
                </Button>
              ) : (
                <Button 
                  variant="destructive"
                  size="lg"
                  onClick={handleStopTracking}
                  className="min-w-[250px] h-14 text-lg font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Square className="w-5 h-5 mr-3" />
                  Arrêter le suivi
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Form Modal */}
        {isFormVisible && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-lg bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-2xl animate-in zoom-in-95 duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Nouvelle tâche
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Projet</label>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <ProjectManager
                      selectedProject={selectedProject}
                      onProjectSelect={setSelectedProject}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Description de la tâche
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Décrivez ce que vous allez faire..."
                    rows={4}
                    className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                </div>

                <div className="flex gap-4 justify-end pt-6">
                  <Button 
                    variant="outline"
                    onClick={() => setIsFormVisible(false)}
                    className="px-6 py-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleStartTracking}
                    disabled={!selectedProject || !taskDescription.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Démarrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 