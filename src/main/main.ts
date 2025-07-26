import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } from 'electron';
import { join } from 'path';
import { DatabaseService } from './database';
import { IdleDetector } from './idle-detector';
import { NotionService } from './notion-service';

interface Settings {
  idleTimeoutMinutes?: number;
  notionApiKey?: string;
  notionWorkspaceId?: string;
  autoSyncToNotion?: boolean;
}

class TrackApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private database: DatabaseService;
  private idleDetector: IdleDetector;
  private notionService: NotionService;

  constructor() {
    this.database = new DatabaseService();
    this.idleDetector = new IdleDetector();
    this.notionService = new NotionService();
    
    this.initializeApp();
    this.loadSettingsAndConfigureIdle();
  }

  private async loadSettingsAndConfigureIdle(): Promise<void> {
    try {
      const settings = await this.database.getSettings();
      // Configure idle detector with user's setting (default 5 minutes if not set)
      const idleTimeoutMinutes = settings.idleTimeoutMinutes || 5;
      this.idleDetector.setIdleTimeout(idleTimeoutMinutes);
      console.log(`Idle timeout configured to ${idleTimeoutMinutes} minutes`);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback to 5 minutes default
      this.idleDetector.setIdleTimeout(5);
    }
  }

  private initializeApp(): void {
    app.whenReady().then(() => {
      this.createWindow();
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
        this.createWindow();
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 700,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js')
      },
      titleBarStyle: 'default',
      show: true,
      resizable: true,
      movable: true,
      minimizable: true,
      maximizable: true,
      frame: true,
      transparent: false
    });

    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createTray(): void {
    const iconPath = join(__dirname, '../../assets/icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    
    this.tray = new Tray(icon);
    this.tray.setToolTip('Track App');
    
    this.updateTrayMenu();
  }

  private updateTrayMenu(): void {
    if (!this.tray) return;

    // Get current time
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const contextMenu = Menu.buildFromTemplate([
      {
        label: `🕐 ${timeString}`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Démarrer le suivi',
        click: () => {
          this.mainWindow?.webContents.send('start-tracking');
        }
      },
      {
        label: 'Arrêter le suivi',
        click: () => {
          this.mainWindow?.webContents.send('stop-tracking');
        }
      },
      { type: 'separator' },
      {
        label: 'Ouvrir Track App',
        click: () => {
          this.mainWindow?.show();
        }
      },
      { type: 'separator' },
      {
        label: 'Quitter',
        click: () => {
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private setupIpcHandlers(): void {
    // Database operations
    ipcMain.handle('db-get-tasks', async (_, filters) => {
      return await this.database.getTasks(filters);
    });

    ipcMain.handle('db-create-task', async (_, task) => {
      return await this.database.createTask(task);
    });

    ipcMain.handle('db-update-task', async (_, task) => {
      return await this.database.updateTask(task);
    });

    ipcMain.handle('db-delete-task', async (_, id) => {
      return await this.database.deleteTask(id);
    });

    // Time statistics
    ipcMain.handle('db-get-total-time-today', async () => {
      return await this.database.getTotalTimeForToday();
    });

    ipcMain.handle('db-get-total-time-week', async () => {
      return await this.database.getTotalTimeForWeek();
    });

    ipcMain.handle('db-get-total-time-month', async () => {
      return await this.database.getTotalTimeForMonth();
    });

    ipcMain.handle('db-get-completed-tasks-count', async () => {
      return await this.database.getCompletedTasksCount();
    });

    ipcMain.handle('db-get-active-projects-count', async () => {
      return await this.database.getActiveProjectsCount();
    });

    // Project operations
    ipcMain.handle('db-get-projects', async () => {
      return await this.database.getProjects();
    });

    ipcMain.handle('db-create-project', async (_, project) => {
      return await this.database.createProject(project);
    });

    ipcMain.handle('db-update-project', async (_, project) => {
      return await this.database.updateProject(project);
    });

    ipcMain.handle('db-delete-project', async (_, id) => {
      return await this.database.deleteProject(id);
    });

    // Customer operations
    ipcMain.handle('db-get-customers', async () => {
      return await this.database.getCustomers();
    });

    ipcMain.handle('db-create-customer', async (_, customer) => {
      return await this.database.createCustomer(customer);
    });

    ipcMain.handle('db-update-customer', async (_, customer) => {
      return await this.database.updateCustomer(customer);
    });

    ipcMain.handle('db-delete-customer', async (_, id) => {
      return await this.database.deleteCustomer(id);
    });

    // Tag operations
    ipcMain.handle('db-get-tags', async () => {
      return await this.database.getTags();
    });

    ipcMain.handle('db-create-tag', async (_, tag) => {
      return await this.database.createTag(tag);
    });

    ipcMain.handle('db-update-tag', async (_, tag) => {
      return await this.database.updateTag(tag);
    });

    ipcMain.handle('db-delete-tag', async (_, id) => {
      return await this.database.deleteTag(id);
    });

    // Bulk operations
    ipcMain.handle('db-bulk-update-task-status', async (_, taskIds, updates) => {
      return await this.database.bulkUpdateTaskStatus(taskIds, updates);
    });

    ipcMain.handle('db-bulk-archive-paid-tasks', async () => {
      return await this.database.bulkArchivePaidTasks();
    });

    // Draft task operations
    ipcMain.handle('db-save-draft-task', async (_, task) => {
      return await this.database.saveDraftTask(task);
    });

    ipcMain.handle('db-complete-draft-task', async (_, taskId, finalEndTime, finalDuration) => {
      return await this.database.completeDraftTask(taskId, finalEndTime, finalDuration);
    });

    // Show idle dialog
    ipcMain.handle('show-idle-dialog', async (_, idleTimeSeconds) => {
      if (!this.mainWindow) return null;
      
      const { dialog } = require('electron');
      const idleMinutes = Math.floor(idleTimeSeconds / 60);
      const remainingSeconds = idleTimeSeconds % 60;
      const timeString = idleMinutes > 0 
        ? `${idleMinutes} minute${idleMinutes !== 1 ? 's' : ''}${remainingSeconds > 0 ? ` and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}` : ''}`
        : `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
      
      const result = await dialog.showMessageBox(this.mainWindow, {
        type: 'question',
        title: 'Idle Time Detected',
        message: `You've been idle for ${timeString}.`,
        detail: 'What would you like to do with the idle time?',
        buttons: [
          'Continue tracking (keep idle time)',
          'Discard idle time and continue',
          'Stop tracking and save session'
        ],
        defaultId: 1,
        cancelId: 2
      });
      
      return result.response;
    });

    // Notion operations
    ipcMain.handle('notion-sync-task', async (_, task, project) => {
      return await this.notionService.syncTask(task, project);
    });

    ipcMain.handle('notion-get-databases', async () => {
      return await this.notionService.getDatabases();
    });

    // Settings
    ipcMain.handle('get-settings', async () => {
      return await this.database.getSettings();
    });

    ipcMain.handle('update-settings', async (_, settings) => {
      const result = await this.database.updateSettings(settings);
      
      // Update idle detector if idleTimeoutMinutes changed
      if (settings.idleTimeoutMinutes !== undefined) {
        this.idleDetector.setIdleTimeout(settings.idleTimeoutMinutes);
        console.log(`Idle timeout updated to ${settings.idleTimeoutMinutes} minutes`);
      }
      
      return result;
    });
  }

  private setupIdleDetection(): void {
    this.idleDetector.onIdle(() => {
      const idleTimeMs = this.idleDetector.getCurrentIdleTime();
      const idleTimeSeconds = Math.floor(idleTimeMs / 1000);
      this.mainWindow?.webContents.send('user-idle', { idleTime: idleTimeSeconds });
    });

    this.idleDetector.onActive(() => {
      this.mainWindow?.webContents.send('user-active');
    });

    // Update tray menu every minute to keep time current
    setInterval(() => {
      this.updateTrayMenu();
    }, 60000); // Update every minute
  }
}

new TrackApp(); 