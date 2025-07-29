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
  customerId?: string;
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
    customerId: '',
    notionDatabaseId: ''
  });
  const [notionDatabases, setNotionDatabases] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    loadProjects();
    loadNotionDatabases();
    loadCustomers();
  }, []);

  const loadNotionDatabases = async () => {
    try {
      if (window.electronAPI) {
        const databases = await window.electronAPI.getNotionDatabases();
        setNotionDatabases(databases);
      }
    } catch (error) {
      console.error('Error loading Notion databases:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      if (window.electronAPI) {
        const customerList = await window.electronAPI.getCustomers();
        setCustomers(customerList);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

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
            alert('Project updated successfully');
          } else {
            await window.electronAPI.createProject({
              ...formData,
              isArchived: false
            });
            alert('Project created successfully');
          }
        
        await loadProjects();
        resetForm();
      }
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert('Error saving project');
    }
  };

  const handleDelete = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?\n\n⚠️ Warning: All tasks associated with this project will also be permanently deleted.')) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteProject(projectId);
          await loadProjects();
          alert('Project and all its tasks deleted successfully');
        }
      } catch (error: any) {
        console.error('Error deleting project:', error);
        const errorMessage = error?.message || 'Error deleting project';
        alert(errorMessage);
      }
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      color: project.color,
      customerId: project.customerId || '',
      notionDatabaseId: project.notionDatabaseId || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#007bff',
      customerId: '',
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
        <Loading text="Loading projects..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Projects</h3>
        <Button 
          size="sm"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Project Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Edit Project' : 'New Project'}
            </DialogTitle>
            <DialogDescription>
              {editingProject ? 'Edit project details' : 'Create a new tracking project'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Project name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
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
              <Label htmlFor="customerId">Customer (optional)</Label>
              <select
                id="customerId"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notionDatabaseId">Notion Database (optional)</Label>
              {notionDatabases.length > 0 ? (
                <select
                  id="notionDatabaseId"
                  value={formData.notionDatabaseId}
                  onChange={(e) => setFormData({ ...formData, notionDatabaseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No Notion sync</option>
                  {notionDatabases.map((db) => (
                    <option key={db.id} value={db.id}>
                      {db.title}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="notionDatabaseId"
                  type="text"
                  value={formData.notionDatabaseId}
                  onChange={(e) => setFormData({ ...formData, notionDatabaseId: e.target.value })}
                  placeholder="Notion database ID"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {notionDatabases.length > 0 
                  ? "Select a database to automatically sync tasks"
                  : "Enter your Notion database ID or leave empty"
                }
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProject ? 'Update' : 'Create'}
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
              <p className="text-muted-foreground mb-4">No projects created</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first project
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
                      <div className="flex items-center gap-2 mt-1">
                        {project.customerId && (
                          <Badge variant="outline" className="text-xs">
                            {customers.find(c => c.id === project.customerId)?.name || 'Unknown Customer'}
                          </Badge>
                        )}
                        {project.notionDatabaseId && (
                          <div className="flex items-center gap-1">
                            <Database className="w-3 h-3 text-muted-foreground" />
                            <Badge variant="secondary" className="text-xs">
                              Connected to Notion
                            </Badge>
                          </div>
                        )}
                      </div>
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