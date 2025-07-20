import React, { useState } from 'react';
import { Plus, FolderOpen, Archive, Edit, Trash2, X } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { formatDate } from '@/lib/utils';

export default function Projects() {
  const { projects, tasks, createProject, updateProject, deleteProject, refreshAllProjects, deleteProjectWithTasks } = useData();
  const [showArchived, setShowArchived] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const activeProjects = projects.filter(p => !p.is_archived);
  const archivedProjects = projects.filter(p => p.is_archived);
  const displayedProjects = showArchived ? archivedProjects : activeProjects;

  // Refresh projects when component mounts
  React.useEffect(() => {
    refreshAllProjects();
  }, []);

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
      refreshAllProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Erreur lors de la création du projet');
    }
  };

  const handleEditProject = (project: any) => {
    setEditingProject({
      ...project,
      name: project.name,
      description: project.description,
      color: project.color
    });
    setShowEditDialog(true);
  };

  const handleUpdateProject = async () => {
    try {
      if (!editingProject.name.trim()) {
        alert('Veuillez entrer un nom pour le projet');
        return;
      }

      await updateProject({
        ...editingProject,
        name: editingProject.name.trim(),
        description: editingProject.description.trim()
      });

      setShowEditDialog(false);
      setEditingProject(null);
      refreshAllProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Erreur lors de la modification du projet');
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const hasTasks = tasks.some(t => t.project_id === projectId);
    
    let message = `Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`;
    if (hasTasks) {
      message += `\n\nCe projet contient des tâches associées. Voulez-vous également supprimer toutes les tâches ?`;
    }
    message += '\n\nCette action est irréversible.';

    if (!confirm(message)) {
      return;
    }

    try {
      if (hasTasks) {
        await deleteProjectWithTasks(projectId);
      } else {
        await deleteProject(projectId);
      }
      refreshAllProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      if (error instanceof Error && error.message.includes('Cannot delete project')) {
        alert('Impossible de supprimer ce projet car il contient des tâches. Veuillez d\'abord supprimer ou réassigner les tâches.');
      } else {
        alert('Erreur lors de la suppression du projet');
      }
    }
  };

  const handleArchiveProject = async (project: any) => {
    try {
      await updateProject({
        ...project,
        is_archived: !project.is_archived
      });
      refreshAllProjects();
    } catch (error) {
      console.error('Error archiving project:', error);
      alert('Erreur lors de l\'archivage du projet');
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

      {/* Edit Project Dialog */}
      {showEditDialog && editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Modifier le projet</h2>
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
                  Nom du projet
                </label>
                                 <input
                   type="text"
                   value={editingProject.name}
                   onChange={(e) => setEditingProject((prev: any) => ({ ...prev, name: e.target.value }))}
                   placeholder="Nom du projet..."
                   className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                 />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                                 <textarea
                   value={editingProject.description}
                   onChange={(e) => setEditingProject((prev: any) => ({ ...prev, description: e.target.value }))}
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
                   value={editingProject.color}
                   onChange={(e) => setEditingProject((prev: any) => ({ ...prev, color: e.target.value }))}
                   className="w-full h-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                 />
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
                onClick={handleUpdateProject}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Enregistrer
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
                <button 
                  onClick={() => handleEditProject(project)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </button>
                                 <button 
                   onClick={() => handleDeleteProject(project.id!)}
                   className="p-1 hover:bg-muted rounded transition-colors"
                 >
                   <Trash2 className="h-4 w-4 text-muted-foreground" />
                 </button>
                                 <button 
                   onClick={() => handleArchiveProject(project)}
                   className="p-1 hover:bg-muted rounded transition-colors"
                   title={project.is_archived ? 'Désarchiver' : 'Archiver'}
                 >
                   <Archive className="h-4 w-4 text-muted-foreground" />
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