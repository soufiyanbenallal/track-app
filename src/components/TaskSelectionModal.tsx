import React, { useState, useEffect } from 'react';
import { Plus, Play, FolderOpen } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useData } from '@/contexts/DataContext';
import { useTracking } from '@/contexts/TrackingContext';

interface TaskSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskSelectionModal({ isOpen, onClose }: TaskSelectionModalProps) {
  const { projects, createTask, createProject } = useData();
  const { startTracking } = useTracking();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  // Set default project if available
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id!);
    }
  }, [projects, selectedProjectId]);

  const handleStartTracking = async () => {
    if (!selectedProjectId || !taskDescription.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const newTask = await createTask({
        project_id: selectedProjectId,
        description: taskDescription.trim(),
        start_time: new Date().toISOString(),
        is_paid: false,
        is_archived: false
      });

      await startTracking(newTask.id!);
      onClose();
      
      // Reset form
      setTaskDescription('');
      setSelectedProjectId(projects.length > 0 ? projects[0].id! : null);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      return;
    }

    try {
      const createdProject = await createProject({
        name: newProject.name,
        description: newProject.description,
        color: newProject.color,
        is_archived: false
      });

      setSelectedProjectId(createdProject.id!);
      setTaskDescription(newProject.description || '');
      setShowNewProjectForm(false);
      setNewProject({ name: '', description: '', color: '#3B82F6' });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const canStart = selectedProjectId && taskDescription.trim() && !isCreating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Démarrer le suivi d'une tâche"
      size="lg"
    >
      <div className="space-y-6">
        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Projet
          </label>
          <div className="space-y-2">
            {projects.length > 0 ? (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id!)}
                  className={`w-full p-3 rounded-lg border transition-colors text-left ${
                    selectedProjectId === project.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color || '#3B82F6' }}
                    />
                    <div>
                      <p className="font-medium text-foreground">{project.name}</p>
                      {project.description && (
                        <p className="text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <FolderOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Aucun projet disponible</p>
              </div>
            )}
            
            <button
              onClick={() => setShowNewProjectForm(true)}
              className="w-full p-3 border border-dashed border-border rounded-lg hover:bg-accent transition-colors text-left"
            >
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Plus className="h-4 w-4" />
                <span>Créer un nouveau projet</span>
              </div>
            </button>
          </div>
        </div>

        {/* New Project Form */}
        {showNewProjectForm && (
          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <h3 className="font-medium text-foreground mb-3">Nouveau projet</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nom du projet
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nom du projet"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Description du projet"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Couleur
                </label>
                <div className="flex space-x-2">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewProject(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 transition-colors ${
                        newProject.color === color ? 'border-foreground' : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateProject}
                  disabled={!newProject.name.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer le projet
                </button>
                <button
                  onClick={() => setShowNewProjectForm(false)}
                  className="px-4 py-2 border border-border rounded-md hover:bg-accent"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description de la tâche
          </label>
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Que faites-vous ?"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleStartTracking}
            disabled={!canStart}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Création...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Démarrer le suivi
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
} 