'use strict'

const { body } = require('express-validator')

/**
 * 登录校验规则
 * 对应前端 LoginParams: { username, password, captcha? }
 */
const loginRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('用户名不能为空'),

  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6 }).withMessage('密码不能少于 6 位')
]

/**
 * 注册校验规则
 * 对应前端 RegisterParams: { username, password, confirmPassword, email?, phone?, captcha? }
 */
const registerRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('用户名不能为空')
    .matches(/^[A-Za-z0-9_]{4,20}$/).withMessage('用户名为 4-20 位字母、数字或下划线'),

  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 8 }).withMessage('密码不能少于 8 位'),

  body('confirmPassword')
    .notEmpty().withMessage('请确认密码'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .isMobilePhone('zh-CN').withMessage('请输入有效的手机号')
]

/**
 * 修改密码校验规则
 */
const changePasswordRules = [
  body('oldPassword')
    .notEmpty().withMessage('原密码不能为空'),

  body('newPassword')
    .notEmpty().withMessage('新密码不能为空')
    .isLength({ min: 6 }).withMessage('新密码不能少于 6 位')
]

/**
 * 刷新 token 校验规则
 */
const refreshTokenRules = [
  body('refreshToken')
    .notEmpty().withMessage('refreshToken 不能为空')
]

module.exports = { loginRules, registerRules, changePasswordRules, refreshTokenRules }
