import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Search, Edit, Trash2, Download, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface Task {
  id: string;
  description: string;
  projectName: string;
  projectColor: string;
  projectId: string;
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

interface ReportData {
  totalHours: number;
  paidHours: number;
  unpaidHours: number;
  projectBreakdown: Array<{
    projectName: string;
    hours: number;
    paidHours: number;
    unpaidHours: number;
  }>;
}

const Reports: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  
  const [filters, setFilters] = useState({
    projectId: '',
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

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    if (activeTab === 'reports') {
      generateReport();
    }
  }, [dateRange, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [taskList, projectList] = await Promise.all([
          window.electronAPI.getTasks(filters),
          window.electronAPI.getProjects()
        ]);
        setTasks(taskList);
        setProjects(projectList);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      if (window.electronAPI) {
        const tasks = await window.electronAPI.getTasks({
          startDate: dateRange.startDate + 'T00:00:00.000Z',
          endDate: dateRange.endDate + 'T23:59:59.999Z'
        });

        let totalSeconds = 0;
        let paidSeconds = 0;
        let unpaidSeconds = 0;
        const projectMap = new Map<string, { name: string; seconds: number; paidSeconds: number; unpaidSeconds: number }>();

        tasks.forEach((task: any) => {
          if (task.duration && task.isCompleted) {
            const duration = task.duration;
            totalSeconds += duration;
            
            if (task.isPaid) {
              paidSeconds += duration;
            } else {
              unpaidSeconds += duration;
            }

            const projectKey = task.projectId;
            if (!projectMap.has(projectKey)) {
              projectMap.set(projectKey, {
                name: task.projectName || 'Projet inconnu',
                seconds: 0,
                paidSeconds: 0,
                unpaidSeconds: 0
              });
            }
            
            const project = projectMap.get(projectKey)!;
            project.seconds += duration;
            if (task.isPaid) {
              project.paidSeconds += duration;
            } else {
              project.unpaidSeconds += duration;
            }
          }
        });

        const projectBreakdown = Array.from(projectMap.values()).map(project => ({
          projectName: project.name,
          hours: project.seconds / 3600,
          paidHours: project.paidSeconds / 3600,
          unpaidHours: project.unpaidSeconds / 3600
        }));

        const reportData: ReportData = {
          totalHours: totalSeconds / 3600,
          paidHours: paidSeconds / 3600,
          unpaidHours: unpaidSeconds / 3600,
          projectBreakdown
        };

        setReportData(reportData);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
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

  const exportToCSV = () => {
    if (!reportData) return;

    const csvContent = [
      'Projet,Heures totales,Heures payées,Heures non payées',
      ...reportData.projectBreakdown.map(project => 
        `${project.projectName},${project.hours},${project.paidHours},${project.unpaidHours}`
      ),
      `Total,${reportData.totalHours},${reportData.paidHours},${reportData.unpaidHours}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${dateRange.startDate}-${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Rapports & Journal</h1>
        <p className="text-muted-foreground">Gérez vos tâches et générez des rapports</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>Filtrez vos tâches selon vos besoins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Rechercher par description..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="project">Projet</Label>
                  <Select value={filters.projectId} onValueChange={(value) => setFilters({ ...filters, projectId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les projets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les projets</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Statut de paiement</Label>
                  <Select 
                    value={filters.isPaid === undefined ? '' : filters.isPaid.toString()} 
                    onValueChange={(value) => setFilters({ 
                      ...filters, 
                      isPaid: value === '' ? undefined : value === 'true' 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      <SelectItem value="true">Payé</SelectItem>
                      <SelectItem value="false">Non payé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completionStatus">Statut de complétion</Label>
                  <Select 
                    value={filters.isCompleted === undefined ? '' : filters.isCompleted.toString()} 
                    onValueChange={(value) => setFilters({ 
                      ...filters, 
                      isCompleted: value === '' ? undefined : value === 'true' 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      <SelectItem value="true">Terminé</SelectItem>
                      <SelectItem value="false">En cours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="archived"
                    checked={filters.isArchived}
                    onCheckedChange={(checked) => setFilters({ ...filters, isArchived: checked as boolean })}
                  />
                  <Label htmlFor="archived">Inclure archivés</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <Card>
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
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: task.projectColor }}
                              />
                              <span className="font-medium text-sm">{task.projectName}</span>
                              <div className="flex gap-2">
                                <Badge variant={task.isPaid ? "default" : "secondary"}>
                                  {task.isPaid ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Payé
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Non payé
                                    </>
                                  )}
                                </Badge>
                                <Badge variant={task.isCompleted ? "default" : "outline"}>
                                  {task.isCompleted ? "Terminé" : "En cours"}
                                </Badge>
                              </div>
                            </div>
                            
                            <h3 className="font-medium">{task.description}</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Début: {formatDate(task.startTime)}</span>
                              </div>
                              {task.endTime && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Fin: {formatDate(task.endTime)}</span>
                                </div>
                              )}
                              {task.duration && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>Durée: {formatDuration(task.duration)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTask(task)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle>Période</CardTitle>
              <CardDescription>Sélectionnez la période pour votre rapport</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="reportStartDate">Date de début</Label>
                  <Input
                    id="reportStartDate"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportEndDate">Date de fin</Label>
                  <Input
                    id="reportEndDate"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  />
                </div>
                <Button onClick={exportToCSV} disabled={!reportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {reportData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatHours(reportData.totalHours)}</div>
                  <p className="text-xs text-muted-foreground">Heures totales</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Payé</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatHours(reportData.paidHours)}</div>
                  <p className="text-xs text-muted-foreground">Heures payées</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Non payé</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatHours(reportData.unpaidHours)}</div>
                  <p className="text-xs text-muted-foreground">Heures non payées</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Project Breakdown */}
          {reportData && (
            <Card>
              <CardHeader>
                <CardTitle>Répartition par projet</CardTitle>
                <CardDescription>Détail des heures par projet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Projet</th>
                        <th className="text-left py-3 px-4 font-medium">Heures totales</th>
                        <th className="text-left py-3 px-4 font-medium">Heures payées</th>
                        <th className="text-left py-3 px-4 font-medium">Heures non payées</th>
                        <th className="text-left py-3 px-4 font-medium">Pourcentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.projectBreakdown.map((project, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{project.projectName}</td>
                          <td className="py-3 px-4">{formatHours(project.hours)}</td>
                          <td className="py-3 px-4 text-green-600">{formatHours(project.paidHours)}</td>
                          <td className="py-3 px-4 text-red-600">{formatHours(project.unpaidHours)}</td>
                          <td className="py-3 px-4">{((project.hours / reportData.totalHours) * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
              <Checkbox
                id="editPaid"
                checked={editForm.isPaid}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isPaid: checked as boolean })}
              />
              <Label htmlFor="editPaid">Payé</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="editCompleted"
                checked={editForm.isCompleted}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isCompleted: checked as boolean })}
              />
              <Label htmlFor="editCompleted">Terminé</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="editArchived"
                checked={editForm.isArchived}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isArchived: checked as boolean })}
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
    </div>
  );
};

export default Reports; 