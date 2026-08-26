/**
 * Production-ready Logger Service
 * Silences debug/info messages in production while preserving errors and warnings for telemetry.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isProduction = import.meta.env.PROD;

  private formatMessage(level: LogLevel, context: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${context}]: ${message}`;
  }

  public debug(context: string, message: string, ...args: unknown[]): void {
    if (!this.isProduction) {
      console.debug(this.formatMessage('debug', context, message), ...args);
    }
  }

  public info(context: string, message: string, ...args: unknown[]): void {
    if (!this.isProduction) {
      console.info(this.formatMessage('info', context, message), ...args);
    }
  }

  public warn(context: string, message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('warn', context, message), ...args);
  }

  public error(context: string, message: string, ...args: unknown[]): void {
    console.error(this.formatMessage('error', context, message), ...args);
  }
}

export const logger = new Logger();
