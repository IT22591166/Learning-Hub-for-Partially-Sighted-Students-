/**
 * Logger Utility
 * Centralized logging for the application
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  constructor(level = LogLevel.INFO) {
    this.level = level;
    this.logs = [];
    this.maxLogs = 1000;
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level);
    
    const logEntry = {
      timestamp,
      level: levelName,
      message,
      data
    };

    // Store in memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output to console if appropriate level
    if (level >= this.level) {
      const prefix = `[${levelName}] ${timestamp}`;
      
      if (level === LogLevel.ERROR) {
        console.error(prefix, message, data);
      } else if (level === LogLevel.WARN) {
        console.warn(prefix, message, data);
      } else if (level === LogLevel.INFO) {
        console.info(prefix, message, data);
      } else {
        console.log(prefix, message, data);
      }
    }
  }

  debug(message, data) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message, data) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message, data) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message, data) {
    this.log(LogLevel.ERROR, message, data);
  }

  setLevel(level) {
    this.level = level;
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger(LogLevel.INFO);
export { LogLevel };
