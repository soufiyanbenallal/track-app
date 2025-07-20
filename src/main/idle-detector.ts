import { EventEmitter } from 'events';

export class IdleDetector extends EventEmitter {
  private idleThreshold: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  private checkInterval: number = 30 * 1000; // Check every 30 seconds
  private lastActivityTime: number = Date.now();
  private intervalId: NodeJS.Timeout | null = null;
  private isIdle: boolean = false;

  constructor() {
    super();
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // In the main process, we'll use a simpler approach
    // that doesn't rely on DOM events
    
    // Start checking for idle state
    this.intervalId = setInterval(() => {
      this.checkIdleState();
    }, this.checkInterval);
  }

  private updateActivity(): void {
    this.lastActivityTime = Date.now();
    
    if (this.isIdle) {
      this.isIdle = false;
      this.emit('active');
    }
  }

  private checkIdleState(): void {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;
    
    if (timeSinceLastActivity >= this.idleThreshold && !this.isIdle) {
      this.isIdle = true;
      this.emit('idle');
    }
  }

  public setIdleThreshold(threshold: number): void {
    this.idleThreshold = threshold;
  }

  public getCurrentState(): { isIdle: boolean; lastActivity: number } {
    return {
      isIdle: this.isIdle,
      lastActivity: this.lastActivityTime
    };
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
} 