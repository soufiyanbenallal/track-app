import { powerMonitor } from 'electron';

export class IdleDetector {
  private idleTimeout: number = 5 * 60 * 1000; // 5 minutes default
  // private idleTimer: NodeJS.Timeout | null = null;
  private isIdle: boolean = false;
  private isPaused: boolean = false;
  private pausedIdleTime: number = 0;
  private onIdleCallback?: () => void;
  private onActiveCallback?: () => void;

  constructor() {
    this.setupIdleDetection();
  }

  setIdleTimeout(minutes: number): void {
    this.idleTimeout = minutes * 60 * 1000;
  }

  onIdle(callback: () => void): void {
    this.onIdleCallback = callback;
  }

  onActive(callback: () => void): void {
    this.onActiveCallback = callback;
  }

  pauseIdleDetection(): void {
    if (!this.isPaused) {
      this.isPaused = true;
      this.pausedIdleTime = powerMonitor.getSystemIdleTime();
    }
  }

  resumeIdleDetection(): void {
    this.isPaused = false;
    this.pausedIdleTime = 0;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  getPausedIdleTime(): number {
    return this.pausedIdleTime;
  }

  private setupIdleDetection(): void {
    // Monitor system idle time
    setInterval(() => {
      if (this.isPaused) return; // Skip detection when paused
      
      const idleTime = powerMonitor.getSystemIdleTime() * 1000; // Convert to milliseconds
      
      if (idleTime >= this.idleTimeout && !this.isIdle) {
        this.isIdle = true;
        this.onIdleCallback?.();
      } else if (idleTime < this.idleTimeout && this.isIdle) {
        this.isIdle = false;
        this.onActiveCallback?.();
      }
    }, 1000); // Check every second

    // Monitor system sleep/wake events
    powerMonitor.on('suspend', () => {
      if (!this.isIdle && !this.isPaused) {
        this.isIdle = true;
        this.onIdleCallback?.();
      }
    });

    powerMonitor.on('resume', () => {
      if (this.isIdle && !this.isPaused) {
        this.isIdle = false;
        this.onActiveCallback?.();
      }
    });
  }

  isUserIdle(): boolean {
    return this.isIdle;
  }

  getCurrentIdleTime(): number {
    // If paused, return the time when it was paused
    if (this.isPaused) {
      return this.pausedIdleTime;
    }
    return powerMonitor.getSystemIdleTime();
  }
} 