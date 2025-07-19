import React, { useState, useEffect } from 'react';
import { useTracking } from '../contexts/TrackingContext';
import ProjectManager from '../components/ProjectManager';
import TaskForm from '../components/TaskForm';
import './Dashboard.css';

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
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Tableau de bord</h1>
        <p className="dashboard-subtitle">Gérez votre temps de travail et suivez vos projets</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Temps total aujourd'hui</h3>
          <p className="stat-value">{formatTime(stats.todayTime)}</p>
          <p className="stat-label">Heures</p>
        </div>
        <div className="stat-card">
          <h3>Tâches terminées</h3>
          <p className="stat-value">{stats.completedTasks}</p>
          <p className="stat-label">Tâches</p>
        </div>
        <div className="stat-card">
          <h3>Projets actifs</h3>
          <p className="stat-value">{stats.activeProjects}</p>
          <p className="stat-label">Projets</p>
        </div>
        <div className="stat-card">
          <h3>Productivité</h3>
          <p className="stat-value">{stats.productivity}%</p>
          <p className="stat-label">%</p>
        </div>
      </div>

      <div className="tracking-section">
        <div className="tracking-header">
          <h2 className="tracking-title">Suivi du temps</h2>
          <p className="tracking-subtitle">
            {state.isTracking ? 'Suivi en cours' : 'Prêt à commencer'}
          </p>
        </div>

        {state.isTracking && state.currentTask && (
          <div className="current-task-display">
            <h3>Tâche en cours</h3>
            <p className="task-description">{state.currentTask.description}</p>
            <p className="task-project">Projet: {selectedProject?.name || 'Projet inconnu'}</p>
            <div className="elapsed-time">
              <span className="time-label">Temps écoulé:</span>
              <span className="time-value">{formatElapsedTime()}</span>
            </div>
          </div>
        )}

        <div className="tracking-controls">
          {!state.isTracking ? (
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => setIsFormVisible(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              Démarrer le suivi
            </button>
          ) : (
            <button 
              className="btn btn-danger btn-lg"
              onClick={handleStopTracking}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="4" width="12" height="16"/>
              </svg>
              Arrêter le suivi
            </button>
          )}
        </div>
      </div>

      {isFormVisible && (
        <div className="task-form-modal">
          <div className="modal-content">
            <h2>Nouvelle tâche</h2>
            
            <div className="form-group">
              <label>Projet</label>
              <ProjectManager
                selectedProject={selectedProject}
                onProjectSelect={setSelectedProject}
              />
            </div>

            <div className="form-group">
              <label>Description de la tâche</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Décrivez ce que vous allez faire..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setIsFormVisible(false)}
              >
                Annuler
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleStartTracking}
                disabled={!selectedProject || !taskDescription.trim()}
              >
                Démarrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 