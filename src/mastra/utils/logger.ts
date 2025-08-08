import pino from 'pino';
import { env } from '../config/env.js';

/**
 * Structured Logger with Pino
 * Provides high-performance, structured logging with graceful fallback
 */

// Create Pino logger instance with environment-based configuration
const logger = pino({
  level: env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      messageFormat: '{emoji} {msg}'
    }
  }
});

/**
 * Enhanced logging interface with emoji support and graceful fallback
 * Falls back to console methods if Pino fails
 */
export const log = {
  /**
   * Info level logging
   * @param msg - Log message
   * @param data - Additional structured data
   * @param emoji - Custom emoji (default: ℹ️)
   */
  info: (msg: string, data?: Record<string, unknown>, emoji: string = 'ℹ️') => {
    try {
      logger.info({ ...data, emoji }, msg);
    } catch (error) {
      console.log(`${emoji} ${msg}`, data ? data : '');
    }
  },

  /**
   * Error level logging
   * @param msg - Error message
   * @param data - Additional structured data
   * @param emoji - Custom emoji (default: ❌)
   */
  error: (msg: string, data?: Record<string, unknown>, emoji: string = '❌') => {
    try {
      logger.error({ ...data, emoji }, msg);
    } catch (error) {
      console.error(`${emoji} ${msg}`, data ? data : '');
    }
  },

  /**
   * Warning level logging
   * @param msg - Warning message
   * @param data - Additional structured data
   * @param emoji - Custom emoji (default: ⚠️)
   */
  warn: (msg: string, data?: Record<string, unknown>, emoji: string = '⚠️') => {
    try {
      logger.warn({ ...data, emoji }, msg);
    } catch (error) {
      console.warn(`${emoji} ${msg}`, data ? data : '');
    }
  },

  /**
   * Debug level logging
   * @param msg - Debug message
   * @param data - Additional structured data
   * @param emoji - Custom emoji (default: 🐛)
   */
  debug: (msg: string, data?: Record<string, unknown>, emoji: string = '🐛') => {
    try {
      logger.debug({ ...data, emoji }, msg);
    } catch (error) {
      console.log(`${emoji} [DEBUG] ${msg}`, data ? data : '');
    }
  },

  /**
   * Success logging (info level with success emoji)
   * @param msg - Success message
   * @param data - Additional structured data
   */
  success: (msg: string, data?: Record<string, unknown>) => {
    try {
      logger.info({ ...data, emoji: '✅' }, msg);
    } catch (error) {
      console.log(`✅ ${msg}`, data ? data : '');
    }
  },

  /**
   * Process/operation logging (info level with gear emoji)
   * @param msg - Process message
   * @param data - Additional structured data
   */
  process: (msg: string, data?: Record<string, unknown>) => {
    try {
      logger.info({ ...data, emoji: '⚙️' }, msg);
    } catch (error) {
      console.log(`⚙️ ${msg}`, data ? data : '');
    }
  },

  /**
   * API/Network logging (info level with network emoji)
   * @param msg - API message
   * @param data - Additional structured data
   */
  api: (msg: string, data?: Record<string, unknown>) => {
    try {
      logger.info({ ...data, emoji: '🌐' }, msg);
    } catch (error) {
      console.log(`🌐 ${msg}`, data ? data : '');
    }
  },

  /**
   * Cost/Financial logging (info level with money emoji)
   * @param msg - Cost message
   * @param data - Additional structured data
   */
  cost: (msg: string, data?: Record<string, unknown>) => {
    try {
      logger.info({ ...data, emoji: '💰' }, msg);
    } catch (error) {
      console.log(`💰 ${msg}`, data ? data : '');
    }
  }
};

/**
 * Raw Pino logger instance for advanced usage
 */
export const rawLogger = logger; 