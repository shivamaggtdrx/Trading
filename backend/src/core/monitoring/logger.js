/**
 * Structured JSON Logger
 * 
 * Replaces console.log across the platform with structured, queryable logs.
 * Outputs JSON format ready for Loki/Grafana ingestion.
 * 
 * Usage:
 *   const logger = require('./core/monitoring/logger');
 *   logger.info('Order executed', { orderId, symbol, side });
 *   logger.error('Execution failed', { error: err.message });
 */

const winston = require('winston');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../../logs');

// Custom format: JSON with timestamp and service tag
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Pretty console format for local dev
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${service || 'app'}] ${level}: ${message}${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'stockslab-backend' },
  transports: [
    // Console: human-readable in dev, JSON in production
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
    }),

    // File: Always JSON (ready for Loki/Grafana ingestion)
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

// ── Child loggers for each subsystem ──
const feedLogger = logger.child({ service: 'market-feed' });
const executionLogger = logger.child({ service: 'execution-engine' });
const riskLogger = logger.child({ service: 'risk-engine' });
const pnlLogger = logger.child({ service: 'pnl-calculator' });
const wsLogger = logger.child({ service: 'socket-io' });

module.exports = {
  logger,
  feedLogger,
  executionLogger,
  riskLogger,
  pnlLogger,
  wsLogger,
};
