import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, Palette, Database, User } from 'lucide-react';
import CustomerDropdown from './CustomerDropdown';

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

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  customers: Customer[];
  onCreateCustomer: () => void;
}

const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  customers,
  onCreateCustomer
}) => {
  const [projectName, setProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notionDatabases, setNotionDatabases] = useState<any[]>([]);

  // Load Notion databases when modal opens
  React.useEffect(() => {
    if (isOpen) {
      loadNotionDatabases();
    }
  }, [isOpen]);

  const loadNotionDatabases = async () => {
    try {
      if (window.electronAPI) {
        const databases = await window.electronAPI.getNotionDatabases();
        setNotionDatabases(databases);
        
        // Auto-select database if there's only one or if we have a default from env
        if (databases.length === 1) {
          setNotionDatabaseId(databases[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading Notion databases:', error);
    }
  };

  const colorOptions = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    setIsLoading(true);
    try {
      await onCreateProject({
        name: projectName.trim(),
        color: selectedColor,
        customerId: selectedCustomer?.id,
        notionDatabaseId: notionDatabaseId.trim() || undefined,
        isArchived: false
      });
      
      // Reset form
      setProjectName('');
      setSelectedColor('#3b82f6');
      setSelectedCustomer(null);
      setNotionDatabaseId('');
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setProjectName('');
      setSelectedColor('#3b82f6');
      setSelectedCustomer(null);
      setNotionDatabaseId('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Nouveau projet
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Créez un nouveau projet pour organiser vos tâches et suivre votre temps de travail.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nom du projet
            </Label>
            <Input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Entrez le nom du projet"
              className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4" />
              Client (optionnel)
            </Label>
            <div className="border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800">
              <CustomerDropdown
                selectedCustomer={selectedCustomer}
                onCustomerSelect={setSelectedCustomer}
                customers={customers}
                onCreateCustomer={onCreateCustomer}
              />
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Couleur
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-slate-900 dark:border-white scale-110' 
                      : 'border-slate-300 dark:border-slate-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Notion Database Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notion-database" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Base de données Notion (optionnel)
            </Label>
            {notionDatabases.length > 0 ? (
              <select
                id="notion-database"
                value={notionDatabaseId}
                onChange={(e) => setNotionDatabaseId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="">Aucune synchronisation Notion</option>
                {notionDatabases.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.title}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="notion-database"
                type="text"
                value={notionDatabaseId}
                onChange={(e) => setNotionDatabaseId(e.target.value)}
                placeholder="ID de base de données Notion (optionnel)"
                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                disabled={isLoading}
              />
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {notionDatabases.length > 0 
                ? "Sélectionnez une base de données pour synchroniser automatiquement les tâches"
                : "Laissez vide si vous ne souhaitez pas synchroniser avec Notion"
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !projectName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isLoading ? 'Création...' : 'Créer le projet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreateModal; 