'use strict'

const express      = require('express')
const router       = express.Router()

const authCtrl     = require('../controllers/authController')
const { loginLimiter } = require('../middlewares/rateLimiter')
const authenticate = require('../middlewares/authenticate')
const validate     = require('../middlewares/validate')
const {
  loginRules,
  registerRules,
  changePasswordRules,
  refreshTokenRules
} = require('../validators/authValidator')

// ──────────────────────────────────────────────────────────
// 公开接口（无需登录）
// ──────────────────────────────────────────────────────────

/**
 * POST /auth/login
 * 用户登录
 */
router.post('/login',
  loginLimiter,          // 登录专项限流
  loginRules,
  validate,
  authCtrl.login
)

/**
 * POST /auth/register
 * 用户注册
 */
router.post('/register',
  registerRules,
  validate,
  authCtrl.register
)

/**
 * POST /auth/refresh
 * 刷新 Access Token
 */
router.post('/refresh',
  refreshTokenRules,
  validate,
  authCtrl.refreshToken
)

/**
 * GET /auth/captcha
 * 获取图片验证码
 */
router.get('/captcha', authCtrl.getCaptcha)

// ──────────────────────────────────────────────────────────
// 需要登录的接口
// ──────────────────────────────────────────────────────────

/**
 * GET /auth/userinfo
 * 获取当前用户信息
 */
router.get('/userinfo',
  authenticate,
  authCtrl.getUserInfo
)

/**
 * POST /auth/logout
 * 退出登录
 */
router.post('/logout',
  authenticate,
  authCtrl.logout
)

/**
 * PUT /auth/password
 * 修改密码
 */
router.put('/password',
  authenticate,
  changePasswordRules,
  validate,
  authCtrl.changePassword
)

module.exports = router
