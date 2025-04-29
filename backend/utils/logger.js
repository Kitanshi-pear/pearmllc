// utils/logger.js
const winston = require('winston');
require('winston-daily-rotate-file');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Add colors to Winston
winston.addColors(colors);

// Create formatters
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create a daily rotate file transport
const fileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/conversion-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

// Create the logger
const logger = winston.createLogger({
  levels,
  format: winston.format.json(),
  defaultMeta: { service: 'conversion-service' },
  transports: [
    // Write logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: fileFormat 
    }),
    
    // Write all logs to the daily rotate file
    fileTransport,
    
    // Write to console with colors
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
  ],
});

// Add stream for Morgan HTTP request logging (if used)
logger.stream = {
  write: function(message) {
    logger.info(message.trim());
  },
};

module.exports = logger;