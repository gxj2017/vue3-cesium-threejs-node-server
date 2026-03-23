'use strict'

/**
 * 轻量级日志工具
 * 生产环境可替换为 winston / pino
 */
const dayjs = require('dayjs')

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 }
const currentLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

function log(level, ...args) {
  if (LEVELS[level] > LEVELS[currentLevel]) return
  const time   = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const prefix = `[${time}] [${level.toUpperCase()}]`
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](prefix, ...args)
}

module.exports = {
  error : (...a) => log('error', ...a),
  warn  : (...a) => log('warn',  ...a),
  info  : (...a) => log('info',  ...a),
  debug : (...a) => log('debug', ...a)
}
