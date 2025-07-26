import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Edit, Trash2, CheckCircle, XCircle, Tag, Plus, Archive, FileText, AlertTriangle } from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import CustomerModal from '@/components/CustomerModal';
import TagModal from '@/components/TagModal';
import { formatDuration, formatHours, formatDate } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Task } from '@/main/database';

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
  const [draftTasks, setDraftTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'archived' | 'drafted'>('tasks');

  // Toast utility function
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if ((window as any).showToast) {
      (window as any).showToast(message, type);
    }
  }, []);
  
  const [filters, setFilters] = useState({
    projectId: '',
    customerId: '',
    tags: '',
    startDate: '',
    endDate: '',
    isPaid: undefined as boolean | undefined,
    isCompleted: undefined as boolean | undefined,
    search: '',
    minDuration: 300, // 5 minutes in seconds (default)
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
  }, [filters, activeTab]);

  useEffect(() => {
    generateStats();
  }, [tasks, dateRange]);

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const currentDate = new Date().toLocaleDateString('en-GB');
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    
    // Header - Entrepreneur Info
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - 50, 25);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Benallal Soufiyan', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Entrepreneur - Software Development', 20, 35);
    doc.text('Email: contact@soufiyan.dev', 20, 45);
    doc.text('Phone: +212 XXX XXX XXX', 20, 55);
    
    // Invoice details (right side)
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceNumber}`, pageWidth - 70, 45);
    doc.text(`Date: ${currentDate}`, pageWidth - 70, 55);
    doc.text(`Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`, pageWidth - 70, 65);
    
    // Customer info (if single customer selected)
    const selectedCustomer = filters.customerId ? customers.find(c => c.id === filters.customerId) : null;
    if (selectedCustomer) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20, 80);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedCustomer.name, 20, 90);
      if (selectedCustomer.email) doc.text(selectedCustomer.email, 20, 100);
      if (selectedCustomer.phone) doc.text(selectedCustomer.phone, 20, 110);
      if (selectedCustomer.address) doc.text(selectedCustomer.address, 20, 120);
    }
    
    // Calculate totals for completed tasks only
    const completedTasks = tasks.filter(task => 
      task.isCompleted && 
      task.duration && 
      task.duration >= filters.minDuration
    );
    let subtotal = 0;
    let totalHours = 0;
    
    // Prepare table data with rates
    const tableData = completedTasks.map(task => {
      const hours = task.duration ? task.duration / 3600 : 0;
      const amount = hours * settings.hourlyRate;
      totalHours += hours;
      subtotal += amount;
      
      return [
        formatDate(task.startTime),
        task.projectName,
        task.description.substring(0, 40) + (task.description.length > 40 ? '...' : ''),
        formatHours(hours),
        `${settings.hourlyRate} MAD`,
        `${amount.toFixed(2)} MAD`
      ];
    });
    
    // Tasks table
    try {
              autoTable(doc, {
          startY: selectedCustomer ? 140 : 100,
          head: [['Date', 'Project', 'Description', 'Hours', 'Rate', 'Amount']],
          body: tableData,
          theme: 'striped',
          headStyles: { 
            fillColor: [30, 41, 59], // slate-800
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 9
          },
          margin: { left: 20, right: 20 }
        });
    } catch (error) {
      console.error('Error creating autoTable:', error);
    }
    
    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    
    // Summary section
    const summaryStartY = finalY + 20;
    const summaryX = pageWidth - 80;
    
    // Summary box
    doc.setDrawColor(200, 200, 200);
    doc.rect(summaryX - 10, summaryStartY - 10, 70, 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Hours: ${formatHours(totalHours)}`, summaryX, summaryStartY);
    doc.text(`Hourly Rate: ${settings.hourlyRate} MAD`, summaryX, summaryStartY + 10);
    doc.text(`Subtotal: ${subtotal.toFixed(2)} MAD`, summaryX, summaryStartY + 20);
    
    // Tax calculation (20% TVA for Morocco)
    const taxRate = 0.20;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;
    
    doc.text(`TVA (20%): ${taxAmount.toFixed(2)} MAD`, summaryX, summaryStartY + 30);
    
    // Total line (bold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL: ${totalAmount.toFixed(2)} MAD`, summaryX, summaryStartY + 45);
    
    // Payment terms
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Payment Terms: Net 30 days', 20, finalY + 50);
    doc.text('Thank you for your business!', 20, finalY + 60);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on ${currentDate}`, 20, doc.internal.pageSize.height - 20);
    
    // Save with invoice number
    doc.save(`invoice-${invoiceNumber}-${dateRange.startDate}-${dateRange.endDate}.pdf`);
  }, [dateRange.startDate, dateRange.endDate, stats, tasks, settings.hourlyRate, filters.customerId, customers, filters.minDuration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + F for search focus
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.getElementById('search');
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Ctrl/Cmd + E for export
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        exportToPDF();
      }
      
      // Ctrl/Cmd + A for select all (when not in input)
      if ((event.ctrlKey || event.metaKey) && event.key === 'a' && 
          !(event.target as HTMLElement).matches('input, textarea')) {
        event.preventDefault();
        setSelectAll(true);
        setSelectedTasks(tasks.map(task => task.id));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tasks, exportToPDF]);

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

  useEffect(() => {
    // Load draft tasks
    const loadDraftTasks = async () => {
      if (window.electronAPI) {
        const drafts = await window.electronAPI.getTasks({ isCompleted: false });
        setDraftTasks(drafts);
      }
    };
    loadDraftTasks();
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        // Create filters based on active tab
        const tabFilters = {
          ...filters,
          isArchived: activeTab === 'archived',
          isCompleted: activeTab === 'drafted' ? false : undefined
        };
        
        const [taskList, projectList, customerList, tagList] = await Promise.all([
          window.electronAPI.getTasks(tabFilters),
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
      showToast('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, activeTab, showToast]);

  const generateStats = useCallback(() => {
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.startTime).toISOString().split('T')[0];
      return taskDate >= dateRange.startDate && 
             taskDate <= dateRange.endDate && 
             task.isCompleted &&
             task.duration &&
             task.duration >= filters.minDuration;
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
    
    // Calculate total days in the selected range
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const totalDaysInRange = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    const averageHoursPerDay = totalHours / totalDaysInRange;
    const totalAmount = totalHours * settings.hourlyRate;
    const unpaidAmount = unpaidHours * settings.hourlyRate;

    setStats({
      totalHours,
      unpaidHours,
      averageHoursPerDay,
      totalAmount,
      unpaidAmount
    });
  }, [tasks, dateRange.startDate, dateRange.endDate, settings.hourlyRate, filters.minDuration]);

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

  const handleUpdateTask = useCallback(async () => {
    if (!editingTask) return;

    try {
      if (window.electronAPI) {
        // Convert boolean values to integers for SQLite compatibility
        await window.electronAPI.updateTask({
          id: editingTask.id,
          description: editForm.description,
          isPaid: editForm.isPaid ? 1 : 0,
          isCompleted: editForm.isCompleted ? 1 : 0,
          isArchived: editForm.isArchived ? 1 : 0,
        });
        setShowEditModal(false);
        setEditingTask(null);
        showToast('Task updated successfully', 'success');
        loadData();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Error updating task', 'error');
    }
  }, [editingTask, editForm, loadData, showToast]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteTask(taskId);
          showToast('Task deleted successfully', 'success');
          loadData();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Error deleting task', 'error');
      }
    }
  }, [loadData, showToast]);

  const handleBulkUpdateStatus = async (updates: Partial<Task>) => {
    if (selectedTasks.length === 0) return;

    try {
      if (window.electronAPI) {
        // Convert boolean values to integers for SQLite compatibility
        const sqliteUpdates = Object.keys(updates).reduce((acc, key) => {
          const value = updates[key as keyof Task];
          if (typeof value === 'boolean') {
            acc[key] = value ? 1 : 0;
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as any);

        await window.electronAPI.bulkUpdateTaskStatus(selectedTasks, sqliteUpdates);
        setSelectedTasks([]);
        setSelectAll(false);
        showToast('Tasks updated successfully', 'success');
        loadData();
      }
    } catch (error) {
      console.error('Error bulk updating tasks:', error);
      showToast('Error updating tasks', 'error');
    }
  };

  const handleBulkArchivePaid = async () => {
    if (confirm('Are you sure you want to archive all paid tasks?')) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.bulkArchivePaidTasks();
          showToast('Paid tasks archived successfully', 'success');
          loadData();
        }
      } catch (error) {
        console.error('Error bulk archiving tasks:', error);
        showToast('Error archiving tasks', 'error');
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

  const handleCompleteDraft = useCallback(async (task: Task) => {
    if (confirm(`Are you sure you want to complete the task "${task.description}"?`)) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.completeDraftTask(task.id, new Date().toISOString(), task.duration || 0);
          showToast('Task completed successfully', 'success');
          loadData();
          setDraftTasks(prev => prev.filter(t => t.id !== task.id));
        }
      } catch (error) {
        console.error('Error completing draft task:', error);
        showToast('Failed to complete draft task', 'error');
      }
    }
  }, [loadData, showToast]);

  const handleDeleteDraft = useCallback(async (taskId: string) => {
    if (confirm('Are you sure you want to discard this incomplete task?')) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteTask(taskId);
          showToast('Draft task discarded', 'success');
          loadData();
          setDraftTasks(prev => prev.filter(t => t.id !== taskId));
        }
      } catch (error) {
        console.error('Error deleting draft task:', error);
        showToast('Failed to discard draft task', 'error');
      }
    }
  }, [loadData, showToast]);

  // Memoized filtered tasks for performance
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.search && !task.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (task.duration && task.duration < filters.minDuration) {
        return false;
      }
      return true;
    });
  }, [tasks, filters.search, filters.minDuration]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <ul className="bg-white/80 shadow-xl rounded-xl flex flex-wrap gap-4 p-4">
                
              <li className="space-y-1">
                <Label htmlFor="project">Project</Label>
              <Select value={filters.projectId || "all"} onValueChange={(value) => handleFilterChange({ projectId: value === "all" ? "" : value })}>
                  <SelectTrigger aria-label="Select a project">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>

            <li className="space-y-1">
              <Label htmlFor="customer">Customer</Label>
              <div className="flex gap-2">
                <Select value={filters.customerId || "all"} onValueChange={(value) => handleFilterChange({ customerId: value === "all" ? "" : value })}>
                  <SelectTrigger className="flex-1" aria-label="Select a customer">
                    <SelectValue placeholder="All customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All customers</SelectItem>
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
            </li>

            <li className="space-y-1">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Select value={filters.tags || "all"} onValueChange={(value) => handleFilterChange({ tags: value === "all" ? "" : value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tags</SelectItem>
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
            </li>

              <li className="space-y-1">
                <Label htmlFor="startDate">Start date</Label>
                <Input
                  id="startDate"
                  type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange({ startDate: e.target.value })}
                />
              </li>

              <li className="space-y-1">
                <Label htmlFor="endDate">End date</Label>
                <Input
                  id="endDate"
                  type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange({ endDate: e.target.value })}
                />
              </li>

              <li className="space-y-1">
                <Label htmlFor="paymentStatus">Payment </Label>
                <Select 
                  value={filters.isPaid === undefined ? 'all' : filters.isPaid.toString()} 
                onValueChange={(value) => handleFilterChange({ 
                    isPaid: value === 'all' ? undefined : value === 'true' 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Paid</SelectItem>
                    <SelectItem value="false">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </li>

              <li className="space-y-1">
                <Label htmlFor="completionStatus">Completion</Label>
                <Select 
                  value={filters.isCompleted === undefined ? 'all' : filters.isCompleted.toString()} 
                onValueChange={(value) => handleFilterChange({ 
                    isCompleted: value === 'all' ? undefined : value === 'true' 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Completed</SelectItem>
                    <SelectItem value="false">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </li>

              <li className="space-y-1">
                <Label htmlFor="minDuration">Min</Label>
                <Input
                  id="minDuration"
                  type="number"
                  min="0"
                  step="1"
                  className='max-w-16'
                  value={filters.minDuration / 60}
                  onChange={(e) => handleFilterChange({ minDuration: Math.max(0, parseFloat(e.target.value) || 0) * 60 })}
                  placeholder="5"
                />
              </li>
        </ul>

        {/* Stats Cards */}
        {stats && (
          <ul className="flex items-center text-white bg-gray-950 rounded-lg">
            <li className='p-3 flex-1'>
                <p className="text-xs">Total hours</p>
                <div className="text-2xl font-bold">{formatHours(stats.totalHours)}</div>
            </li>
            <li className='p-3 flex-1'>
                <p className="text-xs">Unpaid hours</p>
                <div className="text-2xl font-bold text-red-600">{formatHours(stats.unpaidHours)}</div>
            </li>
            <li className='p-3 flex-1'>
                <p className="text-xs">Average hours per day</p>
                <div className="text-2xl font-bold text-blue-600">{formatHours(stats.averageHoursPerDay)}</div>
            </li>
            <li className='p-3 flex-1'>
   
                <p className="text-xs">Total amount</p>
                <div className="text-2xl font-bold text-green-600">{stats.totalAmount.toFixed(2)} MAD</div>
            </li>
            <li className='p-3 flex-1'>
                <p className="text-xs">Unpaid amount</p>
                <div className="text-2xl font-bold text-red-600">{stats.unpaidAmount.toFixed(2)} MAD</div>
            </li>
          </ul>
        )}

        {/* Draft Tasks Recovery Card */}
        {draftTasks.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Incomplete Tasks Recovery
              </CardTitle>
              <CardDescription>
                These tasks were interrupted and need your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {draftTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded border mb-2 last:mb-0">
                  <div>
                    <p className="font-medium">{task.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Started: {formatDate(task.startTime)} • 
                      Duration: {task.duration ? formatDuration(task.duration) : 'Unknown'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleCompleteDraft(task)}
                    >
                      Complete
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteDraft(task.id)}
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tasks List */}
        <div className="bg-white/80 rounded-xl shadow-xl">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'tasks' | 'archived' | 'drafted')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800 rounded-t-xl h-12 border-b border-white/10">
              <TabsTrigger value="tasks" className="text-white data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                Tasks
              </TabsTrigger>
              <TabsTrigger value="archived" className="text-white data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                Archived
              </TabsTrigger>
              <TabsTrigger value="drafted" className="text-white data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                Drafted
              </TabsTrigger>
            </TabsList>
            
            <div className="relative border-b border-white/10 bg-slate-900 h-10">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                id="search"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="pl-10 h-10 bg-transparent border-none w-full text-white focus:outline-none"
                aria-label="Search in tasks"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-1 px-2 border-b bg-slate-900  text-white">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label>Select all</Label>
                </div>
                {selectedTasks.length > 0 && (
                  <Badge variant="secondary">
                    {selectedTasks.length} task(s) selected
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleBulkUpdateStatus({ isPaid: true })}
                  disabled={selectedTasks.length === 0}
                  className="text-xs sm:text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Mark as paid</span>
                  <span className="sm:hidden">Paid</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleBulkUpdateStatus({ isPaid: false })}
                  disabled={selectedTasks.length === 0}
                  className="text-xs sm:text-sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Mark as unpaid</span>
                  <span className="sm:hidden">Unpaid</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkArchivePaid}
                  className="text-xs sm:text-sm"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Archive paid</span>
                  <span className="sm:hidden">Archive</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exportToPDF}
                  className="text-xs sm:text-sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loading text="Loading..." />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">No tasks found</div>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Task list">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 px-2 font-medium" scope="col">
                    
                    </th>
                    <th className="text-left py-1 px-2 font-medium" scope="col">Project</th>
                    <th className="text-left py-1 px-2 font-medium" scope="col">Date</th>
                    <th className="text-left py-1 px-2 font-medium" scope="col">Duration</th>
                    <th className="text-left py-1 px-2 font-medium" scope="col">Status</th>
                    <th className="text-left py-1 px-2 font-medium max-w-20" scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                {filteredTasks.map((task) => (
                    <tr key={task.id} className="border-b hover:bg-muted/50">
                      <td className="py-1 pl-4 relative">
                      <div 
                              className="w-1 rounded-full absolute left-1 inset-y-2"
                              style={{ backgroundColor: task.projectColor }}
                            />
                        <Checkbox
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                          aria-label={`Select task ${task.description}`}
                        />
                      </td>
                      <td className="py-1 px-2">

                        <div className="flex items-center gap-2">
                          <span className={!task.customerName ? 'text-gray-400' :"text-blue-500"}>{task.customerName || 'No customer'}</span> -
                          <span>{task.projectName}</span>
                        </div>
                        <p className="max-w-xs truncate text-xs">{task.description}</p>

                      </td>
                      <td className="py-1 px-2">{formatDate(task.startTime)}</td>
                      <td className="py-1 px-2">{task.duration ? formatDuration(task.duration) : '-'}</td>
                      <td className="py-1 px-2">
                            <div className="flex gap-2">
                              <Badge variant={task.isPaid ? "default" : "secondary"}>
                            {task.isPaid ? "Paid" : "Unpaid"}
                              </Badge>
                         
                            </div>
                      </td>
                      <td className="py-1 px-2">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                            aria-label={`Edit task ${task.description}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            aria-label={`Delete task ${task.description}`}
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
          </Tabs>
        </div>

      {/* Edit Task Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>
              Edit the details of this task
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
              <Label htmlFor="editPaid">Paid</Label>
            </div>
            
     
            
            <div className="flex items-center space-x-2">
              <Switch
                id="editArchived"
                checked={editForm.isArchived}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isArchived: checked })}
              />
              <Label htmlFor="editArchived">Archived</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask}>
              Save
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
    </div>
  );
};

export default Reports; 