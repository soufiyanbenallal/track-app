import { DatabaseManager, Task } from './database';
import { IdleDetector } from './idle-detector';

export interface TrackingStatus {
  isTracking: boolean;
  currentTask?: Task;
  startTime?: Date;
  elapsedTime: number;
  isIdle: boolean;
}

export class TimeTracker {
  private database: DatabaseManager;
  private idleDetector: IdleDetector;
  private currentTask: Task | null = null;
  private startTime: Date | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isIdle: boolean = false;

  constructor(database: DatabaseManager, idleDetector: IdleDetector) {
    this.database = database;
    this.idleDetector = idleDetector;
    
    this.idleDetector.on('idle', () => {
      this.handleIdle();
    });
    
    this.idleDetector.on('active', () => {
      this.handleActive();
    });
  }

  public startTracking(taskId: number): void {
    if (this.isTracking()) {
      this.stopTracking();
    }

    const task = this.database.getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    this.currentTask = task;
    this.startTime = new Date();
    this.isIdle = false;

    // Start update interval
    this.updateInterval = setInterval(() => {
      this.updateElapsedTime();
    }, 1000);

    console.log(`Started tracking task: ${task.description}`);
  }

  public stopTracking(): void {
    if (!this.isTracking()) {
      return;
    }

    if (this.currentTask && this.startTime) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000);

      // Update task with end time and duration
      const updatedTask = {
        ...this.currentTask,
        end_time: endTime.toISOString(),
        duration: duration
      };

      this.database.updateTask(updatedTask);
      console.log(`Stopped tracking task: ${this.currentTask.description}, duration: ${duration}s`);
    }

    this.resetTracking();
  }

  public isTracking(): boolean {
    return this.currentTask !== null && this.startTime !== null;
  }

  public getCurrentTask(): Task | null {
    return this.currentTask;
  }

  public getStatus(): TrackingStatus {
    const elapsedTime = this.startTime 
      ? Math.floor((Date.now() - this.startTime.getTime()) / 1000)
      : 0;

    return {
      isTracking: this.isTracking(),
      currentTask: this.currentTask || undefined,
      startTime: this.startTime || undefined,
      elapsedTime,
      isIdle: this.isIdle
    };
  }

  public handleIdle(): void {
    this.isIdle = true;
    console.log('User is idle, pausing time tracking');
  }

  public handleActive(): void {
    this.isIdle = false;
    console.log('User is active, resuming time tracking');
  }

  private updateElapsedTime(): void {
    if (this.isTracking() && !this.isIdle) {
      // Update elapsed time in real-time
      // This could be used for UI updates
    }
  }

  private resetTracking(): void {
    this.currentTask = null;
    this.startTime = null;
    this.isIdle = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public pauseTracking(): void {
    if (this.isTracking()) {
      this.isIdle = true;
      console.log('Time tracking paused');
    }
  }

  public resumeTracking(): void {
    if (this.isTracking()) {
      this.isIdle = false;
      console.log('Time tracking resumed');
    }
  }
} 