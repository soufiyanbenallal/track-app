import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import { join } from 'path';
import { config } from 'dotenv';
import { DatabaseService } from './database';
import { IdleDetector } from './idle-detector';
import { NotionService } from './notion-service';

// Load environment variables
config();



class TrackApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private database: DatabaseService;
  private idleDetector: IdleDetector;
  private notionService: NotionService;
  private notionSyncQueue: Array<{ task: any; project: any; operation: 'sync' | 'update'; updateType?: 'description' | 'deletion' }> = [];
  private isProcessingQueue = false;

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
      
      // Initialize Notion service with API key - prioritize environment variable
      const notionApiKey = process.env.NOTION_TOKEN || settings.notionApiKey;
      if (notionApiKey) {
        this.notionService.setApiKey(notionApiKey);
        console.log('Notion API key configured from', process.env.NOTION_TOKEN ? 'environment' : 'settings');
        
        // Save to settings if loaded from environment and not already saved
        if (process.env.NOTION_TOKEN && !settings.notionApiKey) {
          await this.database.updateSettings({ notionApiKey: process.env.NOTION_TOKEN });
          console.log('Notion API key saved to settings from environment');
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback to 5 minutes default
      this.idleDetector.setIdleTimeout(5);
    }
  }

  private initializeApp(): void {
    // Set security preferences
    app.on('web-contents-created', (_, contents) => {
      // Prevent navigation to external URLs
      contents.on('will-navigate', (event: any, navigationUrl: string) => {
        const parsedUrl = new URL(navigationUrl);
        if (parsedUrl.origin !== 'file://') {
          event.preventDefault();
        }
      });
    });

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
    // Use app.getAppPath() for development and __dirname for production
    const iconPath = process.env.NODE_ENV === 'development' 
      ? join(process.cwd(), 'assets', 'icon.icns')
      : join(__dirname, '../../assets/icon.icns');
    console.log('Icon path:', iconPath); // Debug log
    
    this.mainWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      icon: iconPath,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js'),
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false
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
      this.mainWindow.loadFile(join(__dirname, 'renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createTray(): void {
    // Use app.getAppPath() for development and __dirname for production
    const iconPath = process.env.NODE_ENV === 'development' 
      ? join(process.cwd(), 'assets', 'icon.png')
      : join(__dirname, '../../assets/icon.png');
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
      const result = await this.database.createTask(task);
      
      // Queue Notion sync for background processing
      try {
        const settings = await this.database.getSettings();
        const notionApiKey = process.env.NOTION_TOKEN || settings.notionApiKey;
        
        console.log('🔍 Notion sync check:', {
          autoSyncToNotion: settings.autoSyncToNotion,
          hasNotionApiKey: !!notionApiKey,
          hasEnvToken: !!process.env.NOTION_TOKEN,
          hasSettingsKey: !!settings.notionApiKey,
          taskProjectId: task.projectId
        });
        
        if (settings.autoSyncToNotion && notionApiKey) {
          const projects = await this.database.getProjects();
          const project = projects.find((p: any) => p.id === task.projectId);
          
          console.log('🔍 Project found:', {
            projectName: project?.name,
            hasNotionDatabaseId: !!project?.notionDatabaseId,
            notionDatabaseId: project?.notionDatabaseId
          });
          
          if (project && project.notionDatabaseId) {
            console.log('✅ Queuing Notion sync for task:', task.description);
            this.queueNotionSync(task, project);
          } else {
            console.log('❌ Project not found or no Notion database ID configured');
            console.log('🔍 Available projects:', projects.map(p => ({
              id: p.id,
              name: p.name,
              hasNotionDatabaseId: !!p.notionDatabaseId,
              notionDatabaseId: p.notionDatabaseId
            })));
          }
        } else {
          console.log('❌ Auto-sync disabled or no Notion API key');
        }
      } catch (error) {
        console.error('Error queuing Notion sync for new task:', error);
      }
      
      return result;
    });

    ipcMain.handle('db-update-task', async (_, task) => {
      const result = await this.database.updateTask(task);
      
      // Queue Notion sync for background processing
      try {
        const settings = await this.database.getSettings();
        if (settings.autoSyncToNotion && settings.notionApiKey) {
          const projects = await this.database.getProjects();
          const project = projects.find((p: any) => p.id === task.projectId);
          
          if (project && project.notionDatabaseId) {
            this.queueNotionUpdate(task, project, 'description');
          }
        }
      } catch (error) {
        console.error('Error queuing Notion update:', error);
      }
      
      return result;
    });

    ipcMain.handle('db-delete-task', async (_, id) => {
      // Get the task before deleting it for Notion sync
      const tasks = await this.database.getTasks({});
      const task = tasks.find(t => t.id === id);
      const result = await this.database.deleteTask(id);
      
      // Queue Notion sync for background processing
      if (task) {
        try {
          const settings = await this.database.getSettings();
          if (settings.autoSyncToNotion && settings.notionApiKey) {
            const projects = await this.database.getProjects();
            const project = projects.find((p: any) => p.id === task.projectId);
            
            if (project && project.notionDatabaseId) {
              this.queueNotionUpdate(task, project, 'deletion');
            }
          }
        } catch (error) {
          console.error('Error queuing Notion deletion:', error);
        }
      }
      
      return result;
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

    // Interrupted task operations
    ipcMain.handle('db-save-interrupted-task', async (_, task) => {
      return await this.database.saveInterruptedTask(task);
    });

    ipcMain.handle('db-get-interrupted-tasks', async () => {
      return await this.database.getInterruptedTasks();
    });

    ipcMain.handle('db-complete-interrupted-task', async (_, taskId) => {
      return await this.database.completeInterruptedTask(taskId);
    });

    ipcMain.handle('db-remove-interrupted-task', async (_, taskId) => {
      return await this.database.removeInterruptedTask(taskId);
    });

    ipcMain.handle('db-update-interrupted-task', async (_, taskId, updates) => {
      return await this.database.updateInterruptedTask(taskId, updates);
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

    // Get current idle time
    ipcMain.handle('get-current-idle-time', async () => {
      return this.idleDetector.getCurrentIdleTime();
    });

    // Idle detection control
    ipcMain.handle('pause-idle-detection', async () => {
      this.idleDetector.pauseIdleDetection();
    });

    ipcMain.handle('resume-idle-detection', async () => {
      this.idleDetector.resumeIdleDetection();
    });

    ipcMain.handle('get-paused-idle-time', async () => {
      return this.idleDetector.getPausedIdleTime();
    });

    // Notion operations
    ipcMain.handle('notion-sync-task', async (_, task, project) => {
      return await this.notionService.syncTask(task, project);
    });

    ipcMain.handle('notion-queue-sync', async (_, task, project) => {
      this.queueNotionSync(task, project);
    });

    ipcMain.handle('notion-update-task', async (_, task, project, updateType) => {
      this.queueNotionUpdate(task, project, updateType);
    });

    ipcMain.handle('notion-get-databases', async () => {
      try {
        return await this.notionService.getDatabases();
      } catch (error) {
        console.error('Error getting Notion databases:', error);
        throw error;
      }
    });

    ipcMain.handle('notion-set-api-key', async (_, apiKey) => {
      // Prioritize environment variable over provided API key
      const notionApiKey = process.env.NOTION_TOKEN || apiKey;
      this.notionService.setApiKey(notionApiKey);
      return true;
    });

    ipcMain.handle('notion-test-connection', async () => {
      return await this.notionService.testConnection();
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
      
      // Update Notion API key if changed - prioritize environment variable
      if (settings.notionApiKey !== undefined) {
        const notionApiKey = process.env.NOTION_TOKEN || settings.notionApiKey;
        this.notionService.setApiKey(notionApiKey);
        console.log('Notion API key updated from', process.env.NOTION_TOKEN ? 'environment' : 'settings');
      }
      
      return result;
    });
  }

  private queueNotionSync(task: any, project: any): void {
    this.notionSyncQueue.push({ task, project, operation: 'sync' });
    this.processNotionSyncQueue();
  }

  private queueNotionUpdate(task: any, project: any, updateType: 'description' | 'deletion'): void {
    this.notionSyncQueue.push({ task, project, operation: 'update', updateType });
    this.processNotionSyncQueue();
  }

  private async processNotionSyncQueue(): Promise<void> {
    if (this.isProcessingQueue || this.notionSyncQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.notionSyncQueue.length > 0) {
      const { task, project, operation, updateType } = this.notionSyncQueue.shift()!;
      
      try {
        if (operation === 'sync') {
          await this.notionService.syncTask(task, project);
          console.log('✅ Background Notion sync completed for task:', task.description);
        } else if (operation === 'update' && updateType) {
          await this.notionService.handleTaskUpdate(task, project, updateType);
          console.log(`✅ Background Notion ${updateType} update completed for task:`, task.description);
        }
      } catch (error) {
        console.error(`❌ Background Notion ${operation} failed for task:`, task.description, error);
        // Continue processing other items in queue even if one fails
      }
      
      // Add a small delay to avoid overwhelming the Notion API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isProcessingQueue = false;
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