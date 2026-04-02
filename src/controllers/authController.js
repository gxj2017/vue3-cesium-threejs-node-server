'use strict'

const bcrypt   = require('bcryptjs')
const dayjs    = require('dayjs')
const config   = require('../config')
const AppError = require('../utils/AppError')
const jwtUtil  = require('../utils/jwt')
const userModel= require('../models/userModel')

// ─── 辅助函数 ─────────────────────────────────────────────

/**
 * 将 UserInfo 格式化为前端类型 UserInfo（对齐前端 types/auth.ts）
 */
function formatUserInfo(user) {
  return {
    id         : user.id,
    username   : user.username,
    nickname   : user.nickname   || null,
    email      : user.email      || null,
    phone      : user.phone      || null,
    avatar     : user.avatar     || null,
    roles      : user.roles,
    permissions: user.permissions,
    createTime : user.createTime
  }
}

/**
 * 计算 token 过期时间戳（毫秒）
 */
function calcExpires(expiresIn) {
  // e.g. '7d' '24h' '3600'
  if (!expiresIn) return null
  const match = String(expiresIn).match(/^(\d+)([smhd])?$/)
  if (!match) return null
  const num  = parseInt(match[1], 10)
  const unit = match[2] || 's'
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
  return Date.now() + num * (unitMs[unit] || 1000)
}

// ─── 业务方法 ──────────────────────────────────────────────

/**
 * 登录
 * POST /auth/login
 * Body: { username, password, captcha? }
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body
    const ip        = req.ip || req.connection?.remoteAddress
    const userAgent = req.headers['user-agent']

    // 1. 查用户（含密码字段）
    const raw = await userModel.findRawByUsername(username)
    if (!raw) {
      await userModel.addLoginLog('unknown', ip, userAgent, 'fail:not_found')
      throw new AppError('用户名或密码错误', 401)
    }

    // 2. 状态检查
    if (raw.status !== 1) {
      throw new AppError('账号已被禁用，请联系管理员', 403)
    }

    // 3. 密码校验
    const match = await bcrypt.compare(password, raw.password)
    if (!match) {
      await userModel.addLoginLog(raw.id, ip, userAgent, 'fail:wrong_password')
      throw new AppError('用户名或密码错误', 401)
    }

    // 4. 签发 token
    const rolesArr = Array.isArray(raw.roles) ? raw.roles : JSON.parse(raw.roles || '[]')
    const payload = { id: raw.id, username: raw.username, roles: rolesArr }
    const token        = jwtUtil.signToken(payload)
    const refreshToken = jwtUtil.signRefreshToken(payload)

    // 5. 记录登录日志
    await userModel.addLoginLog(raw.id, ip, userAgent, 'success')

    // 6. 构造响应（对齐前端 LoginResult）
    const user = await userModel.findById(raw.id)
    res.success({
      token,
      refreshToken,
      expires : calcExpires(config.JWT_EXPIRES_IN),
      userInfo: formatUserInfo(user)
    }, '登录成功')

  } catch (err) {
    next(err)
  }
}

/**
 * 注册
 * POST /auth/register
 * Body: { username, password, confirmPassword, email?, phone?, captcha? }
 */
async function register(req, res, next) {
  try {
    const { username, password, confirmPassword, email, phone } = req.body

    // 1. 二次密码确认（后端再校验一次）
    if (password !== confirmPassword) {
      throw new AppError('两次密码不一致', 400)
    }

    // 2. 用户名唯一性
    const existUser = await userModel.findByUsername(username)
    if (existUser) {
      throw new AppError('用户名已被占用', 409)
    }

    // 3. 邮箱唯一性
    if (email) {
      const existEmail = await userModel.findByEmail(email)
      if (existEmail) {
        throw new AppError('该邮箱已被注册', 409)
      }
    }

    // 4. 密码加密
    const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS)

    // 5. 创建用户
    const newUser = await userModel.create({ username, passwordHash, email, phone })

    res.success({ userId: newUser.id }, '注册成功')

  } catch (err) {
    next(err)
  }
}

/**
 * 获取当前用户信息
 * GET /auth/userinfo
 * Header: Authorization: Bearer <token>
 */
async function getUserInfo(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id)
    if (!user) throw new AppError('用户不存在', 404)
    res.success(formatUserInfo(user))
  } catch (err) {
    next(err)
  }
}

/**
 * 刷新 token
 * POST /auth/refresh
 * Body: { refreshToken }
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken: rt } = req.body
    if (!rt) throw new AppError('refreshToken 不能为空', 400)

    let decoded
    try {
      decoded = jwtUtil.verifyRefreshToken(rt)
    } catch {
      throw new AppError('refreshToken 无效或已过期，请重新登录', 401)
    }

    const user = await userModel.findById(decoded.id)
    if (!user) throw new AppError('用户不存在', 404)
    if (user.status !== 1) throw new AppError('账号已被禁用', 403)

    const payload      = { id: user.id, username: user.username, roles: user.roles }
    const token        = jwtUtil.signToken(payload)
    const newRefreshToken = jwtUtil.signRefreshToken(payload)

    res.success({
      token,
      refreshToken: newRefreshToken,
      expires : calcExpires(config.JWT_EXPIRES_IN),
      userInfo: formatUserInfo(user)
    }, 'token 刷新成功')

  } catch (err) {
    next(err)
  }
}

/**
 * 登出
 * POST /auth/logout
 */
async function logout(_req, res, next) {
  try {
    // 无状态 JWT 登出直接返回成功，前端清除本地 token 即可
    // 如需服务端黑名单，可将 token 存入 refresh_tokens 表的黑名单列表
    res.success(null, '已退出登录')
  } catch (err) {
    next(err)
  }
}

/**
 * 修改密码
 * PUT /auth/password
 * Header: Authorization: Bearer <token>
 * Body: { oldPassword, newPassword }
 */
async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body
    const userId = req.user.id

    // 查含密码的原始记录
    const raw = await userModel.findRawByUsername(req.user.username)
    if (!raw) throw new AppError('用户不存在', 404)

    const match = await bcrypt.compare(oldPassword, raw.password)
    if (!match) throw new AppError('原密码错误', 400)

    if (newPassword.length < 6) throw new AppError('新密码不能少于 6 位', 400)

    const newHash = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS)
    await userModel.updatePassword(userId, newHash)

    res.success(null, '密码修改成功')
  } catch (err) {
    next(err)
  }
}

/**
 * 获取图片验证码（示例实现，实际可对接 svg-captcha）
 * GET /auth/captcha
 */
async function getCaptcha(_req, res, next) {
  try {
    // 简单返回占位，实际可集成 svg-captcha
    const { v4: uuidv4 } = require('uuid')
    const captchaKey = uuidv4()
    // TODO: 生成真实验证码图片并缓存到 Redis
    res.success({
      captchaKey,
      captchaImg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIj48dGV4dCB5PSIzMCI+REVNTzwvdGV4dD48L3N2Zz4='
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { login, register, getUserInfo, refreshToken, logout, changePassword, getCaptcha }
