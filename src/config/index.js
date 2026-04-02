'use strict'

/**
 * 全局配置 —— 统一从 process.env 读取，避免业务代码直接访问 process.env
 */
module.exports = {
  // 服务
  NODE_ENV  : process.env.NODE_ENV   || 'development',
  PORT      : parseInt(process.env.PORT || '3000', 10),
  HOST      : process.env.HOST       || '0.0.0.0',

  // JWT
  JWT_SECRET          : process.env.JWT_SECRET           || 'default-dev-secret',
  JWT_EXPIRES_IN      : process.env.JWT_EXPIRES_IN       || '7d',
  JWT_REFRESH_SECRET  : process.env.JWT_REFRESH_SECRET   || 'default-dev-refresh-secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // 数据库：全项目统一 MongoDB
  MONGODB_URI    : process.env.MONGODB_URI     || 'mongodb://127.0.0.1:27017',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'vue3_cesium_app',
  /** 可选：旧版 database.json 路径，用于首次导入管理员或 npm run db:import-admin */
  DB_PATH: process.env.DB_PATH || './data/database.json',

  // 加密
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),

  // 限流
  RATE_LIMIT_WINDOW_MS : parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX       : parseInt(process.env.RATE_LIMIT_MAX       || '200', 10),
  LOGIN_RATE_LIMIT_MAX : parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '20', 10),

  // CORS
  CORS_ORIGINS: process.env.CORS_ORIGINS || ''
}
