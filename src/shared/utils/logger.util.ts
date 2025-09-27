/**
 * logger.util.ts - Application Logging Utilities
 * 
 * Description: Provides consistent logging functionality throughout the
 * application with different log levels and formatting. Follows Betty
 * coding style guidelines.
 * 
 * Author: Hedera CertChain Team
 * Created: September 27, 2025
 * Last Modified: September 27, 2025
 * 
 * Betty Style Guidelines:
 * - Function names in snake_case
 * - Class names in PascalCase
 * - Constants in UPPER_CASE
 * - Clear documentation for all functions
 */

/* Log level enumeration */
export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

/* Log entry interface */
interface LogEntry {
	timestamp: string;
	level: LogLevel;
	category: string;
	message: string;
	data?: any;
}

/**
 * Logger - Application logging service
 * 
 * Description: Provides structured logging with categories, levels,
 * and consistent formatting for debugging and monitoring.
 */
export class Logger {
	private static instance: Logger;
	private current_level: LogLevel = LogLevel.INFO;
	private logs: LogEntry[] = [];
	private max_logs: number = 1000;

	/**
	 * get_instance - Singleton pattern implementation
	 * 
	 * Description: Returns the singleton logger instance, creating
	 * it if it doesn't exist.
	 * 
	 * Return: Logger instance
	 */
	static get_instance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}

	/**
	 * set_level - Set minimum logging level
	 * 
	 * @level: Minimum log level to output
	 * 
	 * Description: Sets the minimum log level. Messages below this
	 * level will be filtered out.
	 * 
	 * Return: void
	 */
	set_level(level: LogLevel): void {
		this.current_level = level;
	}

	/**
	 * debug - Log debug message
	 * 
	 * @category: Log category/module name
	 * @message: Debug message
	 * @data: Optional additional data
	 * 
	 * Description: Logs a debug-level message with optional data.
	 * Only shown when log level is DEBUG.
	 * 
	 * Return: void
	 */
	debug(category: string, message: string, data?: any): void {
		this.log(LogLevel.DEBUG, category, message, data);
	}

	/**
	 * info - Log information message
	 * 
	 * @category: Log category/module name
	 * @message: Information message
	 * @data: Optional additional data
	 * 
	 * Description: Logs an informational message with optional data.
	 * 
	 * Return: void
	 */
	info(category: string, message: string, data?: any): void {
		this.log(LogLevel.INFO, category, message, data);
	}

	/**
	 * warn - Log warning message
	 * 
	 * @category: Log category/module name
	 * @message: Warning message
	 * @data: Optional additional data
	 * 
	 * Description: Logs a warning-level message with optional data.
	 * 
	 * Return: void
	 */
	warn(category: string, message: string, data?: any): void {
		this.log(LogLevel.WARN, category, message, data);
	}

	/**
	 * error - Log error message
	 * 
	 * @category: Log category/module name
	 * @message: Error message
	 * @data: Optional error data
	 * 
	 * Description: Logs an error-level message with optional error data.
	 * 
	 * Return: void
	 */
	error(category: string, message: string, data?: any): void {
		this.log(LogLevel.ERROR, category, message, data);
	}

	/**
	 * log - Core logging function
	 * 
	 * @level: Log level
	 * @category: Log category/module name
	 * @message: Log message
	 * @data: Optional additional data
	 * 
	 * Description: Core logging implementation that handles formatting,
	 * storage, and console output.
	 * 
	 * Return: void
	 */
	private log(level: LogLevel, category: string, message: string, data?: any): void {
		/* Skip if below current log level */
		if (level < this.current_level) {
			return;
		}

		const timestamp = new Date().toISOString();
		const log_entry: LogEntry = {
			timestamp,
			level,
			category,
			message,
			data,
		};

		/* Add to internal log storage */
		this.logs.push(log_entry);

		/* Maintain max log limit */
		if (this.logs.length > this.max_logs) {
			this.logs.shift();
		}

		/* Output to console */
		this.output_to_console(log_entry);
	}

	/**
	 * output_to_console - Output log entry to console
	 * 
	 * @entry: Log entry to output
	 * 
	 * Description: Formats and outputs log entries to the browser console
	 * with appropriate styling and log levels.
	 * 
	 * Return: void
	 */
	private output_to_console(entry: LogEntry): void {
		const formatted_message = `[${entry.timestamp}] [${LogLevel[entry.level]}] [${entry.category}] ${entry.message}`;
		
		switch (entry.level) {
			case LogLevel.DEBUG:
				console.debug(formatted_message, entry.data || '');
				break;
			case LogLevel.INFO:
				console.info(formatted_message, entry.data || '');
				break;
			case LogLevel.WARN:
				console.warn(formatted_message, entry.data || '');
				break;
			case LogLevel.ERROR:
				console.error(formatted_message, entry.data || '');
				break;
		}
	}

	/**
	 * get_logs - Retrieve stored log entries
	 * 
	 * @level_filter: Optional level filter
	 * 
	 * Description: Returns stored log entries, optionally filtered
	 * by log level for debugging and monitoring.
	 * 
	 * Return: Array of log entries
	 */
	get_logs(level_filter?: LogLevel): LogEntry[] {
		if (level_filter !== undefined) {
			return this.logs.filter(log => log.level >= level_filter);
		}
		return [...this.logs];
	}

	/**
	 * clear_logs - Clear stored log entries
	 * 
	 * Description: Clears all stored log entries from memory.
	 * 
	 * Return: void
	 */
	clear_logs(): void {
		this.logs = [];
	}
}

/* Global logger instance for easy access */
export const app_logger = Logger.get_instance();

/* Convenience functions for common logging */
export const log_debug = (category: string, message: string, data?: any) => 
	app_logger.debug(category, message, data);

export const log_info = (category: string, message: string, data?: any) => 
	app_logger.info(category, message, data);

export const log_warn = (category: string, message: string, data?: any) => 
	app_logger.warn(category, message, data);

export const log_error = (category: string, message: string, data?: any) => 
	app_logger.error(category, message, data);