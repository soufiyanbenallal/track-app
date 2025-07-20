import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, DollarSign, X, Edit, Trash2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useTracking } from '@/contexts/TrackingContext';
import { formatDuration, formatDate, formatDateTime } from '@/lib/utils';

export default function Tasks() {
  const { tasks, projects, refreshTasks, createTask, updateTask, deleteTask } = useData();
  const { status, startTracking, stopTracking } = useTracking();
  const [filters, setFilters] = useState({
    project_id: undefined as number | undefined,
    is_paid: undefined as boolean | undefined,
    search: '',
    start_date: '',
    end_date: '',
    is_archived: false
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({
    project_id: 1,
    description: '',
    is_paid: false
  });

  useEffect(() => {
    refreshTasks(filters);
  }, [filters]);

  const handleStartTracking = (taskId: number) => {
    startTracking(taskId);
  };

  const handleStopTracking = () => {
    stopTracking();
  };

  const handleCreateTask = async () => {
    try {
      if (!newTask.description.trim()) {
        alert('Veuillez entrer une description pour la tâche');
        return;
      }

      await createTask({
        project_id: newTask.project_id,
        description: newTask.description.trim(),
        start_time: new Date().toISOString(),
        is_paid: newTask.is_paid,
        is_archived: false
      });

      setNewTask({
        project_id: 1,
        description: '',
        is_paid: false
      });
      setShowCreateDialog(false);
      refreshTasks(filters);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Erreur lors de la création de la tâche');
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask({
      ...task,
      project_id: task.project_id,
      description: task.description,
      is_paid: task.is_paid
    });
    setShowEditDialog(true);
  };

  const handleUpdateTask = async () => {
    try {
      if (!editingTask.description.trim()) {
        alert('Veuillez entrer une description pour la tâche');
        return;
      }

      await updateTask({
        ...editingTask,
        description: editingTask.description.trim()
      });

      setShowEditDialog(false);
      setEditingTask(null);
      refreshTasks(filters);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Erreur lors de la modification de la tâche');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }

    try {
      await deleteTask(taskId);
      refreshTasks(filters);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Erreur lors de la suppression de la tâche');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.project_id && task.project_id !== filters.project_id) return false;
    if (filters.is_paid !== undefined && task.is_paid !== filters.is_paid) return false;
    if (filters.search && !task.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.is_archived !== undefined && task.is_archived !== filters.is_archived) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tâches</h1>
          <p className="text-muted-foreground">
            Gérez et suivez vos tâches de travail
          </p>
        </div>
        
        <button 
          onClick={() => setShowCreateDialog(true)}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle tâche
        </button>
      </div>

      {/* Create Task Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Nouvelle tâche</h2>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Projet
                </label>
                <select
                  value={newTask.project_id}
                  onChange={(e) => setNewTask(prev => ({ ...prev, project_id: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de la tâche..."
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_paid"
                  checked={newTask.is_paid}
                  onChange={(e) => setNewTask(prev => ({ ...prev, is_paid: e.target.checked }))}
                  className="rounded border-input"
                />
                <label htmlFor="is_paid" className="text-sm text-foreground">
                  Marquer comme payé
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Dialog */}
      {showEditDialog && editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Modifier la tâche</h2>
              <button
                onClick={() => setShowEditDialog(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Projet
                </label>
                <select
                  value={editingTask.project_id}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, project_id: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de la tâche..."
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_paid"
                  checked={editingTask.is_paid}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, is_paid: e.target.checked }))}
                  className="rounded border-input"
                />
                <label htmlFor="is_paid" className="text-sm text-foreground">
                  Marquer comme payé
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowEditDialog(false)}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateTask}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Filtres
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Project Filter */}
          <select
            value={filters.project_id || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              project_id: e.target.value ? Number(e.target.value) : undefined 
            }))}
            className="px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Tous les projets</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {/* Payment Status */}
          <select
            value={filters.is_paid === undefined ? '' : filters.is_paid.toString()}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              is_paid: e.target.value === '' ? undefined : e.target.value === 'true'
            }))}
            className="px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Tous les statuts</option>
            <option value="true">Payé</option>
            <option value="false">Non payé</option>
          </select>

          {/* Date Range */}
          <div className="flex space-x-2">
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              className="flex-1 px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
              className="flex-1 px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Liste des tâches ({filteredTasks.length})
          </h2>
        </div>
        
        {filteredTasks.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-6 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: task.project_color || '#3B82F6' }}
                    />
                    <div>
                      <h3 className="font-medium text-foreground">
                        {task.description}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {task.project_name} • {formatDateTime(task.start_time)}
                      </p>
                      {task.end_time && (
                        <p className="text-sm text-muted-foreground">
                          Durée: {formatDuration(task.duration || 0)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Payment Status */}
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                      task.is_paid 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    }`}>
                      <DollarSign className="h-3 w-3" />
                      <span>{task.is_paid ? 'Payé' : 'En attente'}</span>
                    </div>

                    {/* Duration */}
                    {task.duration && (
                      <div className="text-sm text-muted-foreground font-mono">
                        {formatDuration(task.duration)}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {status.isTracking && status.currentTask?.id === task.id ? (
                        <button
                          onClick={handleStopTracking}
                          className="px-3 py-1 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors text-sm"
                        >
                          Arrêter
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartTracking(task.id!)}
                          disabled={status.isTracking}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Démarrer
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleEditTask(task)}
                        className="px-3 py-1 border border-border rounded-md hover:bg-accent transition-colors text-sm"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteTask(task.id!)}
                        className="px-3 py-1 border border-border rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors text-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Aucune tâche trouvée</h3>
              <p className="text-sm">
                {filters.search || filters.project_id || filters.is_paid !== undefined
                  ? 'Aucune tâche ne correspond à vos filtres.'
                  : 'Commencez par créer votre première tâche.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 