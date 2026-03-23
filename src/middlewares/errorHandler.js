'use strict'

const AppError = require('../utils/AppError')
const logger   = require('../utils/logger')

/**
 * 全局错误处理中间件
 * 必须保留 4 个参数，Express 以此识别为 error handler
 */
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, _next) {
  // 1. 表单校验错误（express-validator）
  if (err.type === 'validation') {
    return res.fail(400, err.message || '请求参数错误', err.errors)
  }

  // 2. 业务错误
  if (err instanceof AppError) {
    logger.warn(`[AppError] ${err.code} ${err.message}`)
    return res.fail(err.code, err.message, err.data)
  }

  // 3. JWT 错误
  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return res.fail(401, 'Token 无效，请重新登录')
  }
  if (err.name === 'TokenExpiredError') {
    return res.fail(401, 'Token 已过期，请重新登录')
  }

  // 4. JSON 解析错误
  if (err.type === 'entity.parse.failed') {
    return res.fail(400, '请求体 JSON 格式错误')
  }

  // 5. 其他未知错误
  logger.error('[UnhandledError]', err)
  const isDev = process.env.NODE_ENV === 'development'
  return res.fail(500, isDev ? err.message : '服务器内部错误')
}
