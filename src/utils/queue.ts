import logger from './logger';

export interface QueueTask<T> {
  id: string;
  execute: () => Promise<T>;
  priority?: number;
  timeout?: number;
  retries?: number;
}

interface QueueOptions {
  concurrency?: number;
  rateLimit?: {
    maxRequests: number;
    timeWindow: number;
  };
  defaultTimeout?: number;
  defaultRetries?: number;
}

export class Queue {
  private tasks: Map<string, QueueTask<any>>;
  private running: Set<string>;
  private concurrency: number;
  private rateLimit?: { maxRequests: number; timeWindow: number };
  private requestCount: number;
  private lastRequestTime: number;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor(options: QueueOptions = {}) {
    this.tasks = new Map();
    this.running = new Set();
    this.concurrency = options.concurrency || 1;
    this.rateLimit = options.rateLimit;
    this.requestCount = 0;
    this.lastRequestTime = Date.now();
    this.defaultTimeout = options.defaultTimeout || 30000;
    this.defaultRetries = options.defaultRetries || 3;
  }

  async enqueue<T>(task: QueueTask<T>): Promise<T> {
    if (this.tasks.has(task.id)) {
      throw new Error(`Task with id ${task.id} already exists`);
    }

    this.tasks.set(task.id, {
      ...task,
      priority: task.priority || 0,
      timeout: task.timeout || this.defaultTimeout,
      retries: task.retries || this.defaultRetries
    });

    logger.debug(`Task ${task.id} enqueued`);
    return this.processNext();
  }

  private async processNext(): Promise<any> {
    if (this.running.size >= this.concurrency) {
      return new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (this.running.size < this.concurrency) {
            clearInterval(checkInterval);
            resolve(this.processNext());
          }
        }, 100);
      });
    }

    const nextTask = this.getNextTask();
    if (!nextTask) {
      return Promise.resolve();
    }

    return this.executeTask(nextTask);
  }

  private getNextTask(): QueueTask<any> | undefined {
    if (this.tasks.size === 0) {
      return undefined;
    }

    let highestPriority = -Infinity;
    let nextTask: QueueTask<any> | undefined;

    for (const [id, task] of this.tasks) {
      if (task.priority! > highestPriority && !this.running.has(id)) {
        highestPriority = task.priority!;
        nextTask = task;
      }
    }

    return nextTask;
  }

  private async executeTask<T>(task: QueueTask<T>): Promise<T> {
    this.running.add(task.id);
    this.tasks.delete(task.id);

    try {
      await this.checkRateLimit();
      
      const result = await Promise.race([
        task.execute(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Task ${task.id} timed out`)), task.timeout);
        })
      ]);

      logger.debug(`Task ${task.id} completed successfully`);
      return result;
    } catch (error) {
      logger.error(`Task ${task.id} failed:`, error);
      
      if (task.retries! > 0) {
        logger.debug(`Retrying task ${task.id}, ${task.retries! - 1} attempts remaining`);
        return this.enqueue({
          ...task,
          retries: task.retries! - 1
        });
      }
      
      throw error;
    } finally {
      this.running.delete(task.id);
      this.processNext().catch(error => {
        logger.error('Error processing next task:', error);
      });
    }
  }

  private async checkRateLimit(): Promise<void> {
    if (!this.rateLimit) {
      return;
    }

    const now = Date.now();
    if (now - this.lastRequestTime >= this.rateLimit.timeWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    if (this.requestCount >= this.rateLimit.maxRequests) {
      const waitTime = this.rateLimit.timeWindow - (now - this.lastRequestTime);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkRateLimit();
    }

    this.requestCount++;
  }

  public size(): number {
    return this.tasks.size;
  }

  public runningCount(): number {
    return this.running.size;
  }

  public clear(): void {
    this.tasks.clear();
    logger.debug('Queue cleared');
  }

  public cancel(taskId: string): boolean {
    const cancelled = this.tasks.delete(taskId);
    if (cancelled) {
      logger.debug(`Task ${taskId} cancelled`);
    }
    return cancelled;
  }
} 