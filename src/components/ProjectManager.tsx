import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Database } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface Project {
  id: string;
  name: string;
  color: string;
  notionDatabaseId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectManagerProps {
  onProjectSelect?: (project: Project) => void;
  selectedProject?: Project | null;
}

const ProjectManager = ({ onProjectSelect, selectedProject }: ProjectManagerProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#007bff',
    notionDatabaseId: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const projectList = await window.electronAPI.getProjects();
        setProjects(projectList);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (window.electronAPI) {
        if (editingProject) {
          await window.electronAPI.updateProject({
            ...editingProject,
            ...formData
          });
        } else {
          await window.electronAPI.createProject({
            ...formData,
            isArchived: false
          });
        }
        
        await loadProjects();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Erreur lors de la sauvegarde du projet');
    }
  };

  const handleDelete = async (projectId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteProject(projectId);
          await loadProjects();
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Erreur lors de la suppression du projet');
      }
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      color: project.color,
      notionDatabaseId: project.notionDatabaseId || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#007bff',
      notionDatabaseId: ''
    });
    setEditingProject(null);
    setShowForm(false);
  };

  const colorOptions = [
    '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
    '#6f42c1', '#fd7e14', '#e83e8c', '#20c997', '#6c757d'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading text="Chargement des projets..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Projets</h3>
        <Button 
          size="sm"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau projet
        </Button>
      </div>

      {/* Project Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Modifier le projet' : 'Nouveau projet'}
            </DialogTitle>
            <DialogDescription>
              {editingProject ? 'Modifiez les détails du projet' : 'Créez un nouveau projet de suivi'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Nom du projet</Label>
              <Input
                id="projectName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom du projet"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color 
                        ? 'border-foreground scale-110' 
                        : 'border-border hover:border-foreground/50'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notionDatabaseId">ID de base de données Notion (optionnel)</Label>
              <Input
                id="notionDatabaseId"
                type="text"
                value={formData.notionDatabaseId}
                onChange={(e) => setFormData({ ...formData, notionDatabaseId: e.target.value })}
                placeholder="ID de la base de données Notion"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button type="submit">
                {editingProject ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Projects List */}
      <div className="space-y-1">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-3">
              <p className="text-muted-foreground mb-4">Aucun projet créé</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer votre premier projet
              </Button>
            </CardContent>
          </Card>
        ) : (
          projects.map(project => (
            <Card 
              key={project.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedProject?.id === project.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : ''
              }`}
              onClick={() => onProjectSelect?.(project)}
            >
              <CardContent >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <h4 className="font-medium">{project.name}</h4>
                      {project.notionDatabaseId && (
                        <div className="flex items-center gap-1 mt-1">
                          <Database className="w-3 h-3 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs">
                            Connecté à Notion
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(project);
                      }}
                    >
                      <Edit className="w-3 h-3 " />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 " />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectManager; 