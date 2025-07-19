import { powerMonitor } from 'electron';

export class IdleDetector {
  private idleTimeout: number = 5 * 60 * 1000; // 5 minutes default
  // private idleTimer: NodeJS.Timeout | null = null;
  private isIdle: boolean = false;
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

  private setupIdleDetection(): void {
    // Monitor system idle time
    setInterval(() => {
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
      if (!this.isIdle) {
        this.isIdle = true;
        this.onIdleCallback?.();
      }
    });

    powerMonitor.on('resume', () => {
      if (this.isIdle) {
        this.isIdle = false;
        this.onActiveCallback?.();
      }
    });
  }

  isUserIdle(): boolean {
    return this.isIdle;
  }

  getCurrentIdleTime(): number {
    return powerMonitor.getSystemIdleTime();
  }
} 