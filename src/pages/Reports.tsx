import React, { useState, useEffect } from 'react';

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
  const [activeTab, setActiveTab] = useState<'tasks' | 'reports'>('tasks');
  
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
    <div className="min-h-screen bg-dark-900 text-gray-100 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-100 mb-2">Rapports & Journal</h1>
        <p className="text-gray-400 text-sm">Gérez vos tâches et générez des rapports</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-dark-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'tasks'
              ? 'bg-primary-600 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Tâches
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'reports'
              ? 'bg-primary-600 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Rapports
        </button>
      </div>

      {activeTab === 'tasks' ? (
        /* Tasks Tab */
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <h3 className="text-lg font-medium text-gray-100 mb-4">Filtres</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Recherche</label>
                <input
                  type="text"
                  placeholder="Rechercher par description..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Projet</label>
                <select
                  value={filters.projectId}
                  onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tous les projets</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date de début</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date de fin</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Statut de paiement</label>
                <select
                  value={filters.isPaid === undefined ? '' : filters.isPaid.toString()}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    isPaid: e.target.value === '' ? undefined : e.target.value === 'true' 
                  })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tous</option>
                  <option value="true">Payé</option>
                  <option value="false">Non payé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Statut de complétion</label>
                <select
                  value={filters.isCompleted === undefined ? '' : filters.isCompleted.toString()}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    isCompleted: e.target.value === '' ? undefined : e.target.value === 'true' 
                  })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tous</option>
                  <option value="true">Terminé</option>
                  <option value="false">En cours</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.isArchived}
                    onChange={(e) => setFilters({ ...filters, isArchived: e.target.checked })}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-600 rounded bg-dark-700"
                  />
                  Inclure archivés
                </label>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="bg-dark-800 rounded-lg border border-dark-700">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Chargement...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Aucune tâche trouvée</div>
            ) : (
              <div className="divide-y divide-dark-700">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-dark-750 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: task.projectColor }}
                          ></div>
                          <span className="text-sm font-medium text-gray-300">{task.projectName}</span>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              task.isPaid 
                                ? 'bg-green-900 text-green-300' 
                                : 'bg-red-900 text-red-300'
                            }`}>
                              {task.isPaid ? 'Payé' : 'Non payé'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              task.isCompleted 
                                ? 'bg-blue-900 text-blue-300' 
                                : 'bg-yellow-900 text-yellow-300'
                            }`}>
                              {task.isCompleted ? 'Terminé' : 'En cours'}
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="text-gray-100 font-medium mb-2">{task.description}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                          <div>
                            <span className="font-medium">Début:</span> {formatDate(task.startTime)}
                          </div>
                          {task.endTime && (
                            <div>
                              <span className="font-medium">Fin:</span> {formatDate(task.endTime)}
                            </div>
                          )}
                          {task.duration && (
                            <div>
                              <span className="font-medium">Durée:</span> {formatDuration(task.duration)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Reports Tab */
        <div className="space-y-6">
          {/* Date Range */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <h3 className="text-lg font-medium text-gray-100 mb-4">Période</h3>
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date de début</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date de fin</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
              >
                Exporter CSV
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          {reportData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 text-center">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Total</h3>
                <p className="text-2xl font-bold text-gray-100">{formatHours(reportData.totalHours)}</p>
                <p className="text-xs text-gray-500">Heures totales</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 text-center">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Payé</h3>
                <p className="text-2xl font-bold text-green-400">{formatHours(reportData.paidHours)}</p>
                <p className="text-xs text-gray-500">Heures payées</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 text-center">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Non payé</h3>
                <p className="text-2xl font-bold text-red-400">{formatHours(reportData.unpaidHours)}</p>
                <p className="text-xs text-gray-500">Heures non payées</p>
              </div>
            </div>
          )}

          {/* Project Breakdown */}
          {reportData && (
            <div className="bg-dark-800 rounded-lg border border-dark-700">
              <div className="p-4 border-b border-dark-700">
                <h3 className="text-lg font-medium text-gray-100">Répartition par projet</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-750">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Projet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Heures totales</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Heures payées</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Heures non payées</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pourcentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {reportData.projectBreakdown.map((project, index) => (
                      <tr key={index} className="hover:bg-dark-750">
                        <td className="px-4 py-3 text-sm text-gray-100">{project.projectName}</td>
                        <td className="px-4 py-3 text-sm text-gray-100">{formatHours(project.hours)}</td>
                        <td className="px-4 py-3 text-sm text-green-400">{formatHours(project.paidHours)}</td>
                        <td className="px-4 py-3 text-sm text-red-400">{formatHours(project.unpaidHours)}</td>
                        <td className="px-4 py-3 text-sm text-gray-100">{((project.hours / reportData.totalHours) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md border border-dark-700">
            <h3 className="text-lg font-medium text-gray-100 mb-4">Modifier la tâche</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.isPaid}
                  onChange={(e) => setEditForm({ ...editForm, isPaid: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-600 rounded bg-dark-700"
                />
                <label className="ml-2 text-sm text-gray-300">Payé</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.isCompleted}
                  onChange={(e) => setEditForm({ ...editForm, isCompleted: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-600 rounded bg-dark-700"
                />
                <label className="ml-2 text-sm text-gray-300">Terminé</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.isArchived}
                  onChange={(e) => setEditForm({ ...editForm, isArchived: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-600 rounded bg-dark-700"
                />
                <label className="ml-2 text-sm text-gray-300">Archivé</label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateTask}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-md transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 