import React, { useState, useEffect } from 'react';
import './ProjectManager.css';

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

const ProjectManager: React.FC<ProjectManagerProps> = ({ onProjectSelect, selectedProject }) => {
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
    return <div className="loading">Chargement des projets...</div>;
  }

  return (
    <div className="project-manager">
      <div className="project-header">
        <h3>Projets</h3>
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(true)}
        >
          Nouveau projet
        </button>
      </div>

      {showForm && (
        <div className="project-form-modal">
          <div className="modal-content">
            <h3>{editingProject ? 'Modifier le projet' : 'Nouveau projet'}</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom du projet</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom du projet"
                  required
                />
              </div>

              <div className="form-group">
                <label>Couleur</label>
                <div className="color-picker">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>ID de base de données Notion (optionnel)</label>
                <input
                  type="text"
                  value={formData.notionDatabaseId}
                  onChange={(e) => setFormData({ ...formData, notionDatabaseId: e.target.value })}
                  placeholder="ID de la base de données Notion"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>Aucun projet créé</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Créer votre premier projet
            </button>
          </div>
        ) : (
          projects.map(project => (
            <div 
              key={project.id} 
              className={`project-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
              onClick={() => onProjectSelect?.(project)}
            >
              <div className="project-info">
                <div 
                  className="project-color" 
                  style={{ backgroundColor: project.color }}
                ></div>
                <div className="project-details">
                  <h4>{project.name}</h4>
                  {project.notionDatabaseId && (
                    <small>Connecté à Notion</small>
                  )}
                </div>
              </div>
              
              <div className="project-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(project);
                  }}
                >
                  Modifier
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(project.id);
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectManager; 