const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const fs = require("fs");
const config = require('config');

class Logger {
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

    this.logger = createLogger({
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

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta instanceof Error ? { stack: meta.stack, message: meta.message } : meta);
  }

  log(level, message, meta = {}) {
    this.logger.log(level, message, meta);
  }
}

module.exports = new Logger();
