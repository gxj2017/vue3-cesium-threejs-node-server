'use strict'

const { verifyToken, extractBearerToken } = require('../utils/jwt')
const AppError = require('../utils/AppError')

/**
 * JWT 鉴权中间件
 * 验证成功后将 decoded payload 挂到 req.user
 */
module.exports = function authenticate(req, _res, next) {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      return next(new AppError('未提供认证 Token，请先登录', 401))
    }
    const decoded = verifyToken(token)
    req.user = decoded   // { id, username, roles, iat, exp }
    next()
  } catch (err) {
    // JsonWebTokenError / TokenExpiredError 会被 errorHandler 捕获
    next(err)
  }
}
