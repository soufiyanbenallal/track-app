import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, DollarSign, Clock } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { formatDuration, getDateRange } from '@/lib/utils';

export default function Reports() {
  const { projects, tasks } = useData();
  const [filters, setFilters] = useState({
    start_date: getDateRange(30).start,
    end_date: getDateRange(30).end,
    project_id: undefined as number | undefined
  });

  const [reportData, setReportData] = useState({
    total_hours: 0,
    paid_hours: 0,
    unpaid_hours: 0,
    tasks_count: 0,
    projects_summary: [] as any[],
    daily_summary: [] as any[]
  });

  useEffect(() => {
    // Calculate report data from tasks
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.start_time).toISOString().split('T')[0];
      if (filters.start_date && taskDate < filters.start_date) return false;
      if (filters.end_date && taskDate > filters.end_date) return false;
      if (filters.project_id && task.project_id !== filters.project_id) return false;
      return true;
    });

    const totalHours = filteredTasks.reduce((sum, task) => sum + (task.duration || 0), 0) / 3600;
    const paidHours = filteredTasks
      .filter(task => task.is_paid)
      .reduce((sum, task) => sum + (task.duration || 0), 0) / 3600;
    const unpaidHours = totalHours - paidHours;

    // Projects summary
    const projectsSummary = projects.map(project => {
      const projectTasks = filteredTasks.filter(task => task.project_id === project.id);
      const hours = projectTasks.reduce((sum, task) => sum + (task.duration || 0), 0) / 3600;
      return {
        project_name: project.name,
        hours,
        tasks_count: projectTasks.length
      };
    }).filter(p => p.hours > 0).sort((a, b) => b.hours - a.hours);

    // Daily summary
    const dailyMap = new Map<string, { hours: number; tasks_count: number }>();
    filteredTasks.forEach(task => {
      const date = new Date(task.start_time).toISOString().split('T')[0];
      const duration = (task.duration || 0) / 3600;
      const existing = dailyMap.get(date) || { hours: 0, tasks_count: 0 };
      dailyMap.set(date, {
        hours: existing.hours + duration,
        tasks_count: existing.tasks_count + 1
      });
    });

    const dailySummary = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setReportData({
      total_hours: totalHours,
      paid_hours: paidHours,
      unpaid_hours: unpaidHours,
      tasks_count: filteredTasks.length,
      projects_summary: projectsSummary,
      daily_summary: dailySummary
    });
  }, [tasks, filters, projects]);

  const exportToPDF = () => {
    // Create a simple HTML report
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
                      <title>TrackApp Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .summary-item { text-align: center; }
            .section { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TrackApp Report</h1>
            <p>Period: ${filters.start_date} to ${filters.end_date}</p>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <h3>Total hours</h3>
              <p>${reportData.total_hours.toFixed(1)}h</p>
            </div>
            <div class="summary-item">
              <h3>Paid hours</h3>
              <p>${reportData.paid_hours.toFixed(1)}h</p>
            </div>
            <div class="summary-item">
              <h3>Pending hours</h3>
              <p>${reportData.unpaid_hours.toFixed(1)}h</p>
            </div>
            <div class="summary-item">
              <h3>Tasks</h3>
              <p>${reportData.tasks_count}</p>
            </div>
          </div>
          
          <div class="section">
            <h2>Project summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Hours</th>
                  <th>Tasks</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.projects_summary.map(project => `
                  <tr>
                    <td>${project.project_name}</td>
                    <td>${project.hours.toFixed(1)}h</td>
                    <td>${project.tasks_count}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2>Daily summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Tasks</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.daily_summary.map(day => `
                  <tr>
                    <td>${new Date(day.date).toLocaleDateString('en-US')}</td>
                    <td>${day.hours.toFixed(1)}h</td>
                    <td>${day.tasks_count}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    // Create a blob and download
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trackapp-report-${filters.start_date}-${filters.end_date}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            Analyze your work time and generate reports
          </p>
        </div>
        
        <button 
          onClick={exportToPDF}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Filters
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Start date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              End date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Project
            </label>
            <select
              value={filters.project_id || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                project_id: e.target.value ? Number(e.target.value) : undefined 
              }))}
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total hours</p>
              <p className="text-2xl font-bold text-foreground">
                {reportData.total_hours.toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Paid hours</p>
              <p className="text-2xl font-bold text-foreground">
                {reportData.paid_hours.toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Pending hours</p>
              <p className="text-2xl font-bold text-foreground">
                {reportData.unpaid_hours.toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Tasks</p>
              <p className="text-2xl font-bold text-foreground">
                {reportData.tasks_count}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Summary */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Project summary
        </h2>
        
        {reportData.projects_summary.length > 0 ? (
          <div className="space-y-4">
            {reportData.projects_summary.map((project, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-foreground">{project.project_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.tasks_count} task{project.tasks_count > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {project.hours.toFixed(1)}h
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {((project.hours / reportData.total_hours) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No data for the selected period
          </p>
        )}
      </div>

      {/* Daily Summary */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Daily summary
        </h2>
        
        {reportData.daily_summary.length > 0 ? (
          <div className="space-y-3">
            {reportData.daily_summary.slice(0, 10).map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-foreground">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {day.tasks_count} task{day.tasks_count > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {day.hours.toFixed(1)}h
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No data for the selected period
          </p>
        )}
      </div>
    </div>
  );
} 