interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = { level: 'info' }) {
    this.config = config;
  }

  private getLogLevel(level: string): number {
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level as keyof typeof levels] || 1;
  }

  private shouldLog(level: string): boolean {
    return this.getLogLevel(level) >= this.getLogLevel(this.config.level);
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix ? `[${this.config.prefix}] ` : '';
    return `${timestamp} ${prefix}${level.toUpperCase()}: ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  // Create a child logger with a prefix
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix
    });
  }
}

// Create and export default logger instance
const logger = new Logger({
  level: process.env.LOG_LEVEL as LoggerConfig['level'] || 'info'
});

export default logger; 