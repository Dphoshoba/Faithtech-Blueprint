import logger from './logger';

type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventCallback[]>;

  constructor() {
    this.events = new Map();
  }

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
    logger.debug(`Event listener added for: ${event}`);
  }

  off(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      return;
    }
    const callbacks = this.events.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      if (callbacks.length === 0) {
        this.events.delete(event);
      }
      logger.debug(`Event listener removed for: ${event}`);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) {
      return;
    }
    this.events.get(event)!.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        logger.error(`Error in event listener for ${event}:`, error);
      }
    });
    logger.debug(`Event emitted: ${event}`);
  }

  once(event: string, callback: EventCallback): void {
    const onceCallback = (...args: any[]) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    this.on(event, onceCallback);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
      logger.debug(`All listeners removed for event: ${event}`);
    } else {
      this.events.clear();
      logger.debug('All event listeners removed');
    }
  }

  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }
} 