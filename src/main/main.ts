import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import * as path from 'path';
import { DatabaseManager } from './database';
import { IdleDetector } from './idle-detector';
import { NotionIntegration } from './notion-integration';
import { TimeTracker } from './time-tracker';

class TrackApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private database: DatabaseManager;
  private idleDetector: IdleDetector;
  private notionIntegration: NotionIntegration;
  private timeTracker: TimeTracker;

  constructor() {
    this.database = new DatabaseManager();
    this.idleDetector = new IdleDetector();
    this.notionIntegration = new NotionIntegration();
    this.timeTracker = new TimeTracker(this.database, this.idleDetector);
    
    this.initializeApp();
  }

  private initializeApp(): void {
    app.whenReady().then(() => {
      this.createMainWindow();
      this.createTray();
      this.setupIpcHandlers();
      this.setupIdleDetection();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true,
        allowRunningInsecureContent: false
      },
      icon: path.join(__dirname, '../../assets/icon.png'),
      show: false
    });

    // Set Content Security Policy
    this.mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:* https:;"
          ]
        }
      });
    });

    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    
    if (isDev) {
      console.log('Loading development server at http://localhost:3000');
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      console.log('Loading production build');
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createTray(): void {
    const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    
    this.tray = new Tray(icon);
    this.tray.setToolTip('TrackApp - Suivi du temps');
    
    this.updateTrayMenu();
  }

  private updateTrayMenu(): void {
    if (!this.tray) return;

    const currentTask = this.timeTracker.getCurrentTask();
    const isTracking = !!currentTask;
    
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: isTracking ? '⏸️ Pause' : '▶️ Démarrer',
        click: () => this.toggleTracking()
      },
      { type: 'separator' },
      {
        label: '📊 Ouvrir TrackApp',
        click: () => this.showMainWindow()
      },
      { type: 'separator' },
      {
        label: '❌ Quitter',
        click: () => app.quit()
      }
    ];

    if (isTracking) {
      template.unshift({
        label: `⏱️ ${currentTask?.description || 'Tâche en cours'}`,
        enabled: false
      });
      template.unshift({ type: 'separator' });
    }

    const contextMenu = Menu.buildFromTemplate(template);
    this.tray.setContextMenu(contextMenu);
  }

  private toggleTracking(): void {
    if (this.timeTracker.isTracking()) {
      this.timeTracker.stopTracking();
    } else {
      // This would open a dialog to select a task
      console.log('Need to select a task to start tracking');
    }
    this.updateTrayMenu();
  }

  private showMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  private setupIpcHandlers(): void {
    console.log('Setting up IPC handlers...');
    
    // Database operations
    ipcMain.handle('db:get-projects', async () => {
      console.log('Handling db:get-projects request');
      try {
        const projects = this.database.getProjects();
        console.log('Projects retrieved:', projects);
        return projects;
      } catch (error) {
        console.error('Error getting projects:', error);
        throw error;
      }
    });
    
    ipcMain.handle('db:get-all-projects', async () => {
      console.log('Handling db:get-all-projects request');
      try {
        const projects = this.database.getAllProjects();
        console.log('All projects retrieved:', projects);
        return projects;
      } catch (error) {
        console.error('Error getting all projects:', error);
        throw error;
      }
    });
    
    ipcMain.handle('db:create-project', (_, project) => this.database.createProject(project));
    ipcMain.handle('db:update-project', (_, project) => this.database.updateProject(project));
    ipcMain.handle('db:delete-project', (_, id) => this.database.deleteProject(id));
    ipcMain.handle('db:delete-project-with-tasks', (_, id) => this.database.deleteProjectWithTasks(id));
    
    ipcMain.handle('db:get-tasks', async (_, filters) => {
      console.log('Handling db:get-tasks request with filters:', filters);
      try {
        const tasks = this.database.getTasks(filters);
        console.log('Tasks retrieved:', tasks);
        return tasks;
      } catch (error) {
        console.error('Error getting tasks:', error);
        throw error;
      }
    });
    
    ipcMain.handle('db:create-task', async (_, task) => {
      console.log('Handling db:create-task request with task:', task);
      try {
        const result = this.database.createTask(task);
        console.log('Task created successfully:', result);
        return result;
      } catch (error) {
        console.error('Error in db:create-task handler:', error);
        throw error;
      }
    });
    ipcMain.handle('db:update-task', (_, task) => this.database.updateTask(task));
    ipcMain.handle('db:delete-task', (_, id) => this.database.deleteTask(id));
    
    // Time tracking
    ipcMain.handle('tracker:start', (_, taskId) => this.timeTracker.startTracking(taskId));
    ipcMain.handle('tracker:stop', () => this.timeTracker.stopTracking());
    ipcMain.handle('tracker:get-current', () => this.timeTracker.getCurrentTask());
    ipcMain.handle('tracker:get-status', async () => {
      console.log('Handling tracker:get-status request');
      try {
        const status = this.timeTracker.getStatus();
        console.log('Tracking status:', status);
        return status;
      } catch (error) {
        console.error('Error getting tracking status:', error);
        throw error;
      }
    });
    
    // Notion integration
    ipcMain.handle('notion:sync-task', (_, taskId) => this.notionIntegration.syncTask(taskId));
    ipcMain.handle('notion:get-projects', () => this.notionIntegration.getProjects());
    
    // Reports
    ipcMain.handle('reports:generate', (_, filters) => this.database.generateReport(filters));
    
    console.log('IPC handlers setup complete');
  }

  private setupIdleDetection(): void {
    this.idleDetector.on('idle', () => {
      this.timeTracker.handleIdle();
    });
    
    this.idleDetector.on('active', () => {
      this.timeTracker.handleActive();
    });
  }
}

new TrackApp(); 