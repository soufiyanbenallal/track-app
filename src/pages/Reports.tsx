import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Search, Edit, Trash2, Download, Calendar, Clock, CheckCircle, XCircle, BarChart3, User, Tag, Plus, Archive, FileText } from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import CustomerModal from '@/components/CustomerModal';
import TagModal from '@/components/TagModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Task {
  id: string;
  description: string;
  projectName: string;
  projectColor: string;
  projectId: string;
  customerName?: string;
  customerId?: string;
  tags?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  isCompleted: boolean;
  isPaid: boolean;
  isArchived: boolean;
}

interface Project {
  id: string;
  name: string;
  color: string;
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

interface Tag {
  id: string;
  name: string;
  color: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalHours: number;
  unpaidHours: number;
  averageHoursPerDay: number;
  totalAmount: number;
  unpaidAmount: number;
}

const Reports: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const [filters, setFilters] = useState({
    projectId: '',
    customerId: '',
    tags: '',
    startDate: '',
    endDate: '',
    isPaid: undefined as boolean | undefined,
    isCompleted: undefined as boolean | undefined,
    isArchived: false,
    search: '',
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [editForm, setEditForm] = useState({
    description: '',
    isPaid: false,
    isCompleted: true,
    isArchived: false,
  });

  const [settings, setSettings] = useState({
    hourlyRate: 100,
    defaultDateRange: '7'
  });

  useEffect(() => {
    loadData();
    loadSettings();
  }, [filters]);

  useEffect(() => {
    generateStats();
  }, [tasks, dateRange]);

  useEffect(() => {
    // Load saved filters from localStorage
    const savedFilters = localStorage.getItem('reportsFilters');
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters);
      setFilters(prev => ({ ...prev, ...parsed }));
    }

    const savedDateRange = localStorage.getItem('reportsDateRange');
    if (savedDateRange) {
      setDateRange(JSON.parse(savedDateRange));
    }
  }, []);

  const loadSettings = async () => {
    try {
      if (window.electronAPI) {
        const settingsData = await window.electronAPI.getSettings();
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [taskList, projectList, customerList, tagList] = await Promise.all([
          window.electronAPI.getTasks(filters),
          window.electronAPI.getProjects(),
          window.electronAPI.getCustomers(),
          window.electronAPI.getTags()
        ]);
        setTasks(taskList);
        setProjects(projectList);
        setCustomers(customerList);
        setTags(tagList);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateStats = () => {
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.startTime).toISOString().split('T')[0];
      return taskDate >= dateRange.startDate && taskDate <= dateRange.endDate && task.isCompleted;
    });

    let totalSeconds = 0;
    let unpaidSeconds = 0;
    const daysSet = new Set<string>();

    filteredTasks.forEach(task => {
      if (task.duration) {
        totalSeconds += task.duration;
        if (!task.isPaid) {
          unpaidSeconds += task.duration;
        }
        const taskDate = new Date(task.startTime).toISOString().split('T')[0];
        daysSet.add(taskDate);
      }
    });

    const totalHours = totalSeconds / 3600;
    const unpaidHours = unpaidSeconds / 3600;
    const averageHoursPerDay = daysSet.size > 0 ? totalHours / daysSet.size : 0;
    const totalAmount = totalHours * settings.hourlyRate;
    const unpaidAmount = unpaidHours * settings.hourlyRate;

    setStats({
      totalHours,
      unpaidHours,
      averageHoursPerDay,
      totalAmount,
      unpaidAmount
    });
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    localStorage.setItem('reportsFilters', JSON.stringify(updatedFilters));
  };

  const handleDateRangeChange = (newDateRange: Partial<typeof dateRange>) => {
    const updatedDateRange = { ...dateRange, ...newDateRange };
    setDateRange(updatedDateRange);
    localStorage.setItem('reportsDateRange', JSON.stringify(updatedDateRange));
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      description: task.description,
      isPaid: task.isPaid,
      isCompleted: task.isCompleted,
      isArchived: task.isArchived,
    });
    setShowEditModal(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    try {
      if (window.electronAPI) {
        await window.electronAPI.updateTask({
          id: editingTask.id,
          description: editForm.description,
          isPaid: editForm.isPaid,
          isCompleted: editForm.isCompleted,
          isArchived: editForm.isArchived,
        });
        setShowEditModal(false);
        setEditingTask(null);
        loadData();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteTask(taskId);
          loadData();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleBulkUpdateStatus = async (updates: Partial<Task>) => {
    if (selectedTasks.length === 0) return;

    try {
      if (window.electronAPI) {
        await window.electronAPI.bulkUpdateTaskStatus(selectedTasks, updates);
        setSelectedTasks([]);
        setSelectAll(false);
        loadData();
      }
    } catch (error) {
      console.error('Error bulk updating tasks:', error);
    }
  };

  const handleBulkArchivePaid = async () => {
    if (confirm('Êtes-vous sûr de vouloir archiver toutes les tâches payées ?')) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.bulkArchivePaidTasks();
          loadData();
        }
      } catch (error) {
        console.error('Error bulk archiving tasks:', error);
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedTasks(tasks.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleCustomerSave = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (window.electronAPI) {
        if (editingCustomer) {
          await window.electronAPI.updateCustomer({ ...customer, id: editingCustomer.id });
        } else {
          await window.electronAPI.createCustomer(customer);
        }
        loadData();
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleTagSave = async (tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (window.electronAPI) {
        if (editingTag) {
          await window.electronAPI.updateTag({ ...tag, id: editingTag.id });
        } else {
          await window.electronAPI.createTag(tag);
        }
        loadData();
      }
    } catch (error) {
      console.error('Error saving tag:', error);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Rapport des Tâches', 20, 20);
    
    // Date range
    doc.setFontSize(12);
    doc.text(`Période: ${dateRange.startDate} - ${dateRange.endDate}`, 20, 35);
    
    // Stats
    if (stats) {
      doc.setFontSize(14);
      doc.text('Statistiques:', 20, 50);
      doc.setFontSize(10);
      doc.text(`Total d'heures: ${formatHours(stats.totalHours)}`, 20, 60);
      doc.text(`Heures non payées: ${formatHours(stats.unpaidHours)}`, 20, 70);
      doc.text(`Moyenne par jour: ${formatHours(stats.averageHoursPerDay)}`, 20, 80);
      doc.text(`Montant total: ${stats.totalAmount.toFixed(2)} MAD`, 20, 90);
      doc.text(`Montant non payé: ${stats.unpaidAmount.toFixed(2)} MAD`, 20, 100);
    }
    
    // Tasks table
    const tableData = tasks.map(task => [
      task.projectName,
      task.customerName || '-',
      task.description.substring(0, 30) + (task.description.length > 30 ? '...' : ''),
      formatDate(task.startTime),
      task.duration ? formatDuration(task.duration) : '-',
      task.isPaid ? 'Payé' : 'Non payé',
      task.isCompleted ? 'Terminé' : 'En cours'
    ]);
    
    (doc as any).autoTable({
      startY: 120,
      head: [['Projet', 'Client', 'Description', 'Date', 'Durée', 'Statut', 'Complétion']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`rapport-${dateRange.startDate}-${dateRange.endDate}.pdf`);
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

  const formatHours = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.search && !task.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Analyse et rapports
            </span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Rapports & Journal
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Gérez vos tâches et générez des rapports détaillés
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatHours(stats.totalHours)}</div>
                <p className="text-xs text-muted-foreground">Heures totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Non payé</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatHours(stats.unpaidHours)}</div>
                <p className="text-xs text-muted-foreground">Heures non payées</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moyenne/jour</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatHours(stats.averageHoursPerDay)}</div>
                <p className="text-xs text-muted-foreground">Heures par jour</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Montant total</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalAmount.toFixed(2)} MAD</div>
                <p className="text-xs text-muted-foreground">Montant total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Non payé</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.unpaidAmount.toFixed(2)} MAD</div>
                <p className="text-xs text-muted-foreground">Montant non payé</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Filtres
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Filtrez vos tâches selon vos besoins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Recherche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Rechercher..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange({ search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project">Projet</Label>
                <Select value={filters.projectId || "all"} onValueChange={(value) => handleFilterChange({ projectId: value === "all" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les projets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les projets</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">Client</Label>
                <div className="flex gap-2">
                  <Select value={filters.customerId || "all"} onValueChange={(value) => handleFilterChange({ customerId: value === "all" ? "" : value })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Tous les clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les clients</SelectItem>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCustomer(null);
                      setShowCustomerModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Select value={filters.tags || "all"} onValueChange={(value) => handleFilterChange({ tags: value === "all" ? "" : value })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Tous les tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les tags</SelectItem>
                      {tags.map(tag => (
                        <SelectItem key={tag.id} value={tag.name}>{tag.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTag(null);
                      setShowTagModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange({ startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange({ endDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Statut de paiement</Label>
                <Select 
                  value={filters.isPaid === undefined ? 'all' : filters.isPaid.toString()} 
                  onValueChange={(value) => handleFilterChange({ 
                    isPaid: value === 'all' ? undefined : value === 'true' 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="true">Payé</SelectItem>
                    <SelectItem value="false">Non payé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="completionStatus">Statut de complétion</Label>
                <Select 
                  value={filters.isCompleted === undefined ? 'all' : filters.isCompleted.toString()} 
                  onValueChange={(value) => handleFilterChange({ 
                    isCompleted: value === 'all' ? undefined : value === 'true' 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="true">Terminé</SelectItem>
                    <SelectItem value="false">En cours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="archived"
                  checked={filters.isArchived}
                  onCheckedChange={(checked) => handleFilterChange({ isArchived: checked as boolean })}
                />
                <Label htmlFor="archived">Inclure archivés</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label>Tout sélectionner</Label>
                </div>
                {selectedTasks.length > 0 && (
                  <Badge variant="secondary">
                    {selectedTasks.length} tâche(s) sélectionnée(s)
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkUpdateStatus({ isPaid: true })}
                  disabled={selectedTasks.length === 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marquer comme payé
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkUpdateStatus({ isPaid: false })}
                  disabled={selectedTasks.length === 0}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Marquer comme non payé
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkArchivePaid}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archiver payées
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exporter PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Tâches</CardTitle>
            <CardDescription>Liste de toutes vos tâches</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loading text="Chargement..." />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Aucune tâche trouvée</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium">Projet</th>
                      <th className="text-left py-3 px-4 font-medium">Client</th>
                      <th className="text-left py-3 px-4 font-medium">Description</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Durée</th>
                      <th className="text-left py-3 px-4 font-medium">Statut</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedTasks.includes(task.id)}
                            onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: task.projectColor }}
                            />
                            <span>{task.projectName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{task.customerName || '-'}</td>
                        <td className="py-3 px-4 max-w-xs truncate">{task.description}</td>
                        <td className="py-3 px-4">{formatDate(task.startTime)}</td>
                        <td className="py-3 px-4">{task.duration ? formatDuration(task.duration) : '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Badge variant={task.isPaid ? "default" : "secondary"}>
                              {task.isPaid ? "Payé" : "Non payé"}
                            </Badge>
                            <Badge variant={task.isCompleted ? "default" : "outline"}>
                              {task.isCompleted ? "Terminé" : "En cours"}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTask(task)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la tâche</DialogTitle>
            <DialogDescription>
              Modifiez les détails de cette tâche
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="editPaid"
                checked={editForm.isPaid}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isPaid: checked })}
              />
              <Label htmlFor="editPaid">Payé</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="editCompleted"
                checked={editForm.isCompleted}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isCompleted: checked })}
              />
              <Label htmlFor="editCompleted">Terminé</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="editArchived"
                checked={editForm.isArchived}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isArchived: checked })}
              />
              <Label htmlFor="editArchived">Archivé</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateTask}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Modal */}
      <CustomerModal
        open={showCustomerModal}
        onOpenChange={setShowCustomerModal}
        customer={editingCustomer}
        onSave={handleCustomerSave}
      />

      {/* Tag Modal */}
      <TagModal
        open={showTagModal}
        onOpenChange={setShowTagModal}
        tag={editingTag}
        onSave={handleTagSave}
      />
    </div>
  );
};

export default Reports; 