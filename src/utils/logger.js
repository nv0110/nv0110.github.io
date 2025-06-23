/**
 * Logger utility - follows best practices from major sites
 * - Silent in production builds
 * - Minimal, important-only logs in development
 * - Filtered by log levels
 */

const isDevelopment = import.meta.env.DEV;
const isDebugMode = localStorage.getItem('debug') === 'true';

class Logger {
  constructor() {
    this.levels = {
      ERROR: 0,
      WARN: 1, 
      INFO: 2,
      DEBUG: 3
    };
    
    // Only show important logs in development, nothing in production
    this.currentLevel = isDevelopment ? this.levels.INFO : -1;
    
    // Debug mode can be enabled manually for troubleshooting
    if (isDebugMode) {
      this.currentLevel = this.levels.DEBUG;
    }
  }

  error(...args) {
    if (this.currentLevel >= this.levels.ERROR) {
      console.error('❌', ...args);
    }
  }

  warn(...args) {
    if (this.currentLevel >= this.levels.WARN) {
      console.warn('⚠️', ...args);
    }
  }

  info(...args) {
    if (this.currentLevel >= this.levels.INFO) {
      console.info('ℹ️', ...args);
    }
  }

  debug(...args) {
    if (this.currentLevel >= this.levels.DEBUG) {
      console.debug('🔧', ...args);
    }
  }

  // Silent methods for removing noisy logs entirely
  silence() {
    // Does nothing - for replacing noisy console.log calls
  }

  // Database operation logging (important events only)
  dbOperation(action, details) {
    if (this.currentLevel >= this.levels.INFO) {
      console.info('💾', `${action}:`, details);
    }
  }

  // User interaction logging (for analytics/debugging)
  userAction(action, details) {
    if (this.currentLevel >= this.levels.DEBUG) {
      console.debug('👤', `User ${action}:`, details);
    }
  }
}

export const logger = new Logger();

// Helper to enable debug mode
export const enableDebugMode = () => {
  localStorage.setItem('debug', 'true');
  window.location.reload();
};

export const disableDebugMode = () => {
  localStorage.removeItem('debug');
  window.location.reload();
}; 
