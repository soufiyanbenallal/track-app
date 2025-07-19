import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import { join } from 'path';
import { DatabaseService } from './database';
import { IdleDetector } from './idle-detector';
import { NotionService } from './notion-service';

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
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js')
      },
      titleBarStyle: 'hiddenInset',
      show: false
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

    const contextMenu = Menu.buildFromTemplate([
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
      return await this.database.updateSettings(settings);
    });
  }

  private setupIdleDetection(): void {
    this.idleDetector.onIdle(() => {
      this.mainWindow?.webContents.send('user-idle');
    });

    this.idleDetector.onActive(() => {
      this.mainWindow?.webContents.send('user-active');
    });
  }
}

new TrackApp(); 