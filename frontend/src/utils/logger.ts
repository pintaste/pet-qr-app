/**
 * Centralized Logging Utility
 *
 * Provides consistent logging across the application with:
 * - Environment-aware logging (development vs production)
 * - Structured log levels
 * - Optional log grouping and timing
 * - Easy to extend for external logging services
 */

// =============================================================================
// Types
// =============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogOptions {
  /** Additional context data to include with the log */
  data?: unknown
  /** Whether to group this log with others */
  group?: string
  /** Whether to measure execution time */
  timing?: boolean
}

interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel
  /** Whether logging is enabled */
  enabled: boolean
  /** Prefix for all log messages */
  prefix: string
  /** Whether to include timestamps */
  includeTimestamp: boolean
}

// =============================================================================
// Constants
// =============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#9CA3AF', // gray
  info: '#3B82F6',  // blue
  warn: '#F59E0B',  // yellow
  error: '#EF4444', // red
}

// =============================================================================
// Configuration
// =============================================================================

const defaultConfig: LoggerConfig = {
  minLevel: import.meta.env.DEV ? 'debug' : 'warn',
  enabled: true,
  prefix: '[PetQR]',
  includeTimestamp: import.meta.env.DEV,
}

// =============================================================================
// Logger Class
// =============================================================================

class Logger {
  private config: LoggerConfig
  private timers: Map<string, number> = new Map()
  private activeGroups: Set<string> = new Set()

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel]
  }

  /**
   * Format the log message with prefix and timestamp
   */
  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = []

    if (this.config.prefix) {
      parts.push(this.config.prefix)
    }

    if (this.config.includeTimestamp) {
      const now = new Date()
      const time = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      const ms = now.getMilliseconds().toString().padStart(3, '0')
      parts.push(`[${time}.${ms}]`)
    }

    parts.push(`[${level.toUpperCase()}]`)
    parts.push(message)

    return parts.join(' ')
  }

  /**
   * Output log to console
   */
  private log(level: LogLevel, message: string, options?: LogOptions): void {
    if (!this.shouldLog(level)) return

    const formattedMessage = this.formatMessage(level, message)
    const color = LOG_COLORS[level]

    // Start group if specified
    if (options?.group && !this.activeGroups.has(options.group)) {
      console.group(`%c${options.group}`, `color: ${color}; font-weight: bold`)
      this.activeGroups.add(options.group)
    }

    // Output based on level
    const consoleMethod = level === 'debug' ? 'log' : level
    if (options?.data !== undefined) {
      console[consoleMethod](
        `%c${formattedMessage}`,
        `color: ${color}`,
        options.data
      )
    } else {
      console[consoleMethod](
        `%c${formattedMessage}`,
        `color: ${color}`
      )
    }

    // End group after all logs in group are done
    // Note: Groups are ended manually with endGroup()
  }

  // Public log methods

  /**
   * Debug level log - for development debugging
   */
  debug(message: string, options?: LogOptions): void {
    this.log('debug', message, options)
  }

  /**
   * Info level log - for general information
   */
  info(message: string, options?: LogOptions): void {
    this.log('info', message, options)
  }

  /**
   * Warning level log - for potential issues
   */
  warn(message: string, options?: LogOptions): void {
    this.log('warn', message, options)
  }

  /**
   * Error level log - for errors
   */
  error(message: string, options?: LogOptions): void {
    this.log('error', message, options)
  }

  // Utility methods

  /**
   * Start a timer for performance measurement
   */
  time(label: string): void {
    this.timers.set(label, performance.now())
    this.debug(`Timer started: ${label}`)
  }

  /**
   * End a timer and log the duration
   */
  timeEnd(label: string): void {
    const start = this.timers.get(label)
    if (start) {
      const duration = performance.now() - start
      this.debug(`Timer ended: ${label}`, { data: `${duration.toFixed(2)}ms` })
      this.timers.delete(label)
    } else {
      this.warn(`Timer not found: ${label}`)
    }
  }

  /**
   * Start a log group
   */
  group(label: string): void {
    if (!this.shouldLog('debug')) return
    console.group(`%c${this.config.prefix} ${label}`, 'font-weight: bold')
    this.activeGroups.add(label)
  }

  /**
   * End a log group
   */
  groupEnd(label?: string): void {
    if (!this.shouldLog('debug')) return
    console.groupEnd()
    if (label) {
      this.activeGroups.delete(label)
    }
  }

  /**
   * Log a table of data
   */
  table(data: unknown[], columns?: string[]): void {
    if (!this.shouldLog('debug')) return
    if (columns) {
      console.table(data, columns)
    } else {
      console.table(data)
    }
  }

  /**
   * Clear the console
   */
  clear(): void {
    console.clear()
  }

  /**
   * Create a child logger with a specific prefix
   */
  createChild(childPrefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: `${this.config.prefix}${childPrefix}`,
    })
  }
}

// =============================================================================
// Export
// =============================================================================

/**
 * Default logger instance
 */
export const logger = new Logger()

/**
 * Create a logger for a specific module
 *
 * @example
 * ```ts
 * const log = createLogger('[Auth]')
 * log.info('User logged in')
 * // Output: [PetQR][Auth] [INFO] User logged in
 * ```
 */
export const createLogger = (modulePrefix: string): Logger => {
  return logger.createChild(modulePrefix)
}

/**
 * Export Logger class for custom instances
 */
export { Logger }
export type { LogLevel, LogOptions, LoggerConfig }
