const winston = require('winston');
const path = require('path');

// Custom format for readable logs
const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
});

// Create the logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true })
    ),
    transports: [
        // Console - colored output for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        }),

        // File - all logs
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/app.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston.format.combine(logFormat)
        }),

        // File - errors only
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 3,
            format: winston.format.combine(logFormat)
        })
    ]
});

// Morgan stream for HTTP request logging
logger.stream = {
    write: (message) => logger.info(message.trim())
};

module.exports = logger;
