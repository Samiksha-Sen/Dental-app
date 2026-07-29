const winston = require('winston');
const path = require('path');

const logsDir = path.resolve(__dirname, '../logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logsDir, 'test-execution.log') }),
    new winston.transports.File({ filename: path.join(logsDir, 'failures.log'), level: 'error' }),
  ],
});

function logApiCall({ method, url, status, durationMs, requestBody, responseBody }) {
  logger.info(`API ${method} ${url} -> ${status} (${durationMs}ms)`, {
    requestBody,
    responseBody,
  });
}

function logDbOperation({ table, operation, success, detail }) {
  const level = success ? 'info' : 'error';
  logger[level](`DB ${operation} on ${table} -> ${success ? 'ok' : 'failed'}`, { detail });
}

module.exports = { logger, logApiCall, logDbOperation };
