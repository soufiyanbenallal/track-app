import React, { useState } from 'react';
import { Plus, FolderOpen, Archive, Edit, Trash2, X } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { formatDate } from '@/lib/utils';

export default function Projects() {
  const { projects, createProject, updateProject, deleteProject } = useData();
  const [showArchived, setShowArchived] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const activeProjects = projects.filter(p => !p.is_archived);
  const archivedProjects = projects.filter(p => p.is_archived);
  const displayedProjects = showArchived ? archivedProjects : activeProjects;

  const handleCreateProject = async () => {
    try {
      if (!newProject.name.trim()) {
        alert('Veuillez entrer un nom pour le projet');
        return;
      }

      await createProject({
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        color: newProject.color,
        is_archived: false
      });

      setNewProject({
        name: '',
        description: '',
        color: '#3B82F6'
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Erreur lors de la création du projet');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projets</h1>
          <p className="text-muted-foreground">
            Gérez vos projets de travail
          </p>
        </div>
        
        <button 
          onClick={() => setShowCreateDialog(true)}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau projet
        </button>
      </div>

      {/* Create Project Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Nouveau projet</h2>
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
                  Nom du projet
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom du projet..."
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du projet..."
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Couleur
                </label>
                <input
                  type="color"
                  value={newProject.color}
                  onChange={(e) => setNewProject(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
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
                onClick={handleCreateProject}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Archived */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setShowArchived(false)}
          className={`px-4 py-2 rounded-md transition-colors ${
            !showArchived
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Projets actifs ({activeProjects.length})
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`px-4 py-2 rounded-md transition-colors ${
            showArchived
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <Archive className="mr-2 h-4 w-4 inline" />
          Archivés ({archivedProjects.length})
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedProjects.map((project) => (
          <div
            key={project.id}
            className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: project.color || '#3B82F6' }}
              />
              <div className="flex items-center space-x-2">
                <button className="p-1 hover:bg-muted rounded transition-colors">
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="p-1 hover:bg-muted rounded transition-colors">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            
            <h3 className="font-semibold text-foreground mb-2">
              {project.name}
            </h3>
            
            {project.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {project.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Créé le {formatDate(project.created_at)}</span>
              {project.notion_id && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Notion
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displayedProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <FolderOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {showArchived ? 'Aucun projet archivé' : 'Aucun projet'}
            </h3>
            <p className="text-sm">
              {showArchived 
                ? 'Vous n\'avez pas encore archivé de projets.'
                : 'Commencez par créer votre premier projet.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 