'use strict'

const rateLimit = require('express-rate-limit')
const config    = require('../config')

/**
 * 全局限流 —— 防止 DDoS
 */
const globalLimiter = rateLimit({
  windowMs : config.RATE_LIMIT_WINDOW_MS,
  max      : config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders  : false,
  message  : {
    code   : 429,
    success: false,
    data   : null,
    message: '请求过于频繁，请稍后再试',
    timestamp: Date.now()
  }
})

/**
 * 登录专用限流 —— 防止暴力破解
 */
const loginLimiter = rateLimit({
  windowMs : config.RATE_LIMIT_WINDOW_MS,
  max      : config.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders  : false,
  message  : {
    code   : 429,
    success: false,
    data   : null,
    message: '登录尝试过于频繁，请 15 分钟后再试',
    timestamp: Date.now()
  }
})

module.exports = globalLimiter
module.exports.loginLimiter = loginLimiter
