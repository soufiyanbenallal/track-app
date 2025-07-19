import React, { useState, useEffect } from 'react';
import './Reports.css';

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
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    generateReport();
  }, [dateRange]);

  const generateReport = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        // Get tasks for the date range
        const tasks = await window.electronAPI.getTasks({
          startDate: dateRange.startDate + 'T00:00:00.000Z',
          endDate: dateRange.endDate + 'T23:59:59.999Z'
        });

        // Calculate totals
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

            // Group by project
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

        // Convert to hours and create project breakdown
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
    } finally {
      setLoading(false);
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

  const formatHours = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <div className="reports">
      <div className="reports-header">
        <h1>Rapports</h1>
        <p>Générez des rapports détaillés de votre temps de travail</p>
      </div>

      <div className="date-range-section">
        <div className="date-inputs">
          <div className="form-group">
            <label>Date de début</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Date de fin</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={generateReport}>
          Générer le rapport
        </button>
      </div>

      {loading ? (
        <div className="loading">Génération du rapport...</div>
      ) : reportData ? (
        <div className="report-content">
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total</h3>
              <p className="summary-value">{formatHours(reportData.totalHours)}</p>
              <p className="summary-label">Heures totales</p>
            </div>
            <div className="summary-card paid">
              <h3>Payé</h3>
              <p className="summary-value">{formatHours(reportData.paidHours)}</p>
              <p className="summary-label">Heures payées</p>
            </div>
            <div className="summary-card unpaid">
              <h3>Non payé</h3>
              <p className="summary-value">{formatHours(reportData.unpaidHours)}</p>
              <p className="summary-label">Heures non payées</p>
            </div>
          </div>

          <div className="project-breakdown">
            <div className="section-header">
              <h2>Répartition par projet</h2>
              <button className="btn btn-secondary" onClick={exportToCSV}>
                Exporter CSV
              </button>
            </div>

            <div className="breakdown-table">
              <table>
                <thead>
                  <tr>
                    <th>Projet</th>
                    <th>Heures totales</th>
                    <th>Heures payées</th>
                    <th>Heures non payées</th>
                    <th>Pourcentage</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.projectBreakdown.map((project, index) => (
                    <tr key={index}>
                      <td>{project.projectName}</td>
                      <td>{formatHours(project.hours)}</td>
                      <td>{formatHours(project.paidHours)}</td>
                      <td>{formatHours(project.unpaidHours)}</td>
                      <td>{((project.hours / reportData.totalHours) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>Sélectionnez une période pour générer un rapport</p>
        </div>
      )}
    </div>
  );
};

export default Reports; 