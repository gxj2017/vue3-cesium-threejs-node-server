'use strict'

const { validationResult } = require('express-validator')

/**
 * express-validator 统一校验结果中间件
 * 在每个路由的校验规则之后、controller 之前调用
 */
module.exports = function validate(req, _res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => `${e.path}: ${e.msg}`)
    const err      = new Error(messages[0])
    err.type       = 'validation'
    err.errors     = errors.array()
    return next(err)
  }
  next()
}
