// ==================================================
// =============== Module Dependencies ==============
// ==================================================
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const config = require('config');

// ==================================================
// =================== Logger Class =================
// ==================================================
class Logger {
    // ==================================================
    // =============== Class Initialization =============
    // ==================================================
    #logger;

    constructor(options = {}) {
        const {
            logDirectory = path.resolve(__dirname, "../../logs"),
            level = config.get('env') === "dev" ? "debug" : "info",
            maxFiles = "14d",
            maxSize = "20m",
        } = options;

        // Ensure log directory exists
        if (!fs.existsSync(logDirectory)) {
            fs.mkdirSync(logDirectory, { recursive: true });
        }

        const logFormat = format.combine(
            format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            format.errors({ stack: true }),
            format.splat(),
            format.json()
        );

        this.#logger = createLogger({
            level,
            format: logFormat,
            transports: [
                new DailyRotateFile({
                    filename: path.join(logDirectory, "application-%DATE%.log"),
                    datePattern: "YYYY-MM-DD",
                    zippedArchive: true,
                    maxSize,
                    maxFiles,
                    level: "info",
                }),
                new transports.Console({
                    level,
                    format: format.combine(
                        format.colorize(),
                        format.printf(({ level, message, timestamp, stack }) => {
                            return `${timestamp} [${level}]: ${stack || message}`;
                        })
                    )
                }),
            ],
            exceptionHandlers: [
                new transports.File({ filename: path.join(logDirectory, "exceptions.log") })
            ],
            rejectionHandlers: [
                new transports.File({ filename: path.join(logDirectory, "rejections.log") })
            ]
        });
    }

    // ==================================================
    // =============== Getters and Setters ==============
    // ==================================================

    get logger() {
        return this.#logger;
    }

    // ==================================================
    // ============= Public Instance Methods ============
    // ==================================================
    /**
     * Create an information message when an action is taken
     * @method
     * @param {string} message - a message to log when an action occurs
     * @param {Object} meta - any other meta data about the info message
     */
    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    /**
     * Create a message particularly for debugging in development
     * @method
     * @param {*} message - a message to log when an action occurs
     * @param {*} meta - any other meta data about the debugging message
     */
    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    /**
     * Create a warning message particularly for deprecations and things that may lead to future errors
     * @method
     * @param {string} message - deprecation warnings and things that may lead to errors later on
     * @param {Object} meta - any other meta data about the warning message
     */
    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    /**
     * Create an error message to easily see issues when they occur.
     * @method
     * @param {string} message - a message to log when an error has occured to easily fix and debug issues.
     * @param {Object} meta - any other meta data about the error message.
     */
    error(message, meta = {}) {
        this.logger.error(message, meta instanceof Error ? { stack: meta.stack, message: meta.message } : meta);
    }

    /**
     * Logs and error to the error logs.
     * @method
     * @param {string} level - level of issue.
     * @param {string} message - a message to log. 
     * @param {*} meta - any other meta data about this log.
     */
    log(level, message, meta = {}) {
        this.logger.log(level, message, meta);
    }
}

module.exports = new Logger();
