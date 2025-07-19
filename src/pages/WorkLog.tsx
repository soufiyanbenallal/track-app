import React, { useState, useEffect } from 'react';
import './WorkLog.css';

interface Task {
  id: string;
  description: string;
  projectName: string;
  projectColor: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  isPaid: boolean;
  isArchived: boolean;
}

const WorkLog: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    projectId: '',
    startDate: '',
    endDate: '',
    isPaid: undefined as boolean | undefined,
    search: '',
  });

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const taskList = await window.electronAPI.getTasks(filters);
        setTasks(taskList);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteTask(taskId);
          loadTasks();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.search && !task.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="work-log">
      <div className="work-log-header">
        <h1>Journal de travail</h1>
        <p>Consultez et gérez vos sessions de travail</p>
      </div>

      <div className="filters-section">
        <div className="filters-grid">
          <div className="form-group">
            <label>Recherche</label>
            <input
              type="text"
              placeholder="Rechercher par description..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Date de début</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Date de fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Statut de paiement</label>
            <select
              value={filters.isPaid === undefined ? '' : filters.isPaid.toString()}
              onChange={(e) => setFilters({ 
                ...filters, 
                isPaid: e.target.value === '' ? undefined : e.target.value === 'true' 
              })}
            >
              <option value="">Tous</option>
              <option value="true">Payé</option>
              <option value="false">Non payé</option>
            </select>
          </div>
        </div>
      </div>

      <div className="tasks-section">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <p>Aucune tâche trouvée</p>
          </div>
        ) : (
          <div className="tasks-list">
            {filteredTasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-header">
                  <div className="task-project">
                    <div 
                      className="project-color" 
                      style={{ backgroundColor: task.projectColor }}
                    ></div>
                    <span>{task.projectName}</span>
                  </div>
                  <div className="task-status">
                    <span className={`status-badge ${task.isPaid ? 'paid' : 'unpaid'}`}>
                      {task.isPaid ? 'Payé' : 'Non payé'}
                    </span>
                  </div>
                </div>

                <div className="task-content">
                  <h3 className="task-description">{task.description}</h3>
                  <div className="task-details">
                    <div className="task-time">
                      <span className="label">Début:</span>
                      <span>{formatDate(task.startTime)}</span>
                    </div>
                    {task.endTime && (
                      <div className="task-time">
                        <span className="label">Fin:</span>
                        <span>{formatDate(task.endTime)}</span>
                      </div>
                    )}
                    {task.duration && (
                      <div className="task-duration">
                        <span className="label">Durée:</span>
                        <span className="duration-value">{formatDuration(task.duration)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="task-actions">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkLog; 