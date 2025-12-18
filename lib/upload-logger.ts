/**
 * Custom event-based logger for questions upload
 * Emits events that can be captured by UI components
 */

export type LogLevel = 'info' | 'success' | 'error' | 'warning' | 'api' | 'debug';

export type LogEvent = {
  id: number;
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
};

type LogListener = (event: LogEvent) => void;

class UploadLogger {
  private listeners: LogListener[] = [];
  private logIdCounter = 0;
  private isEnabled = true;

  /**
   * Subscribe to log events
   */
  subscribe(listener: LogListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Emit log event to all listeners
   */
  private emit(level: LogLevel, message: string, data?: any) {
    if (!this.isEnabled) {
      return;
    }

    const event: LogEvent = {
      id: this.logIdCounter++,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data,
    };

    this.listeners.forEach(listener => listener(event));
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Info level logs
   */
  info(emoji: string, ...args: any[]) {
    const message = `${emoji} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
    this.emit('info', message);
  }

  /**
   * Success logs
   */
  success(...args: any[]) {
    const message = `✅ ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
    this.emit('success', message);
  }

  /**
   * Warning logs
   */
  warning(...args: any[]) {
    const message = `⚠️  ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
    this.emit('warning', message);
  }

  /**
   * Error logs
   */
  error(...args: any[]) {
    const message = `❌ ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
    this.emit('error', message);
  }

  /**
   * API call logs
   */
  apiCall(method: string, url: string, data?: any) {
    const message = data
      ? `📤 API Call: ${method} ${url}`
      : `🔍 API Call: ${method} ${url}`;
    this.emit('api', message, data);
  }

  /**
   * API response logs
   */
  apiResponse(method: string, url: string, info?: string) {
    const message = `✅ API Response: ${method} ${url}${info ? ` - ${info}` : ''}`;
    this.emit('success', message);
  }

  /**
   * Section separator
   */
  separator() {
    this.emit('info', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Section header
   */
  section(title: string) {
    this.separator();
    this.emit('info', `📋 ${title}`);
    this.separator();
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logIdCounter = 0;
  }
}

// Export singleton instance
export const uploadLogger = new UploadLogger();
