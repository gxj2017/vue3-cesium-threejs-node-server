'use strict'

const { success, fail } = require('../utils/response')

/**
 * 在 res 对象上挂载 res.success() / res.fail() 快捷方法
 * 保持与前端 ApiResponse 格式完全对齐
 */
module.exports = function respond(_req, res, next) {
  /**
   * res.success(data, message?, httpStatus?)
   */
  res.success = function (data, message = 'success', httpStatus = 200) {
    return success(this, data, message, httpStatus)
  }

  /**
   * res.fail(code, message?, data?, httpStatus?)
   */
  res.fail = function (code = 500, message = '服务器内部错误', data = null, httpStatus) {
    return fail(this, code, message, data, httpStatus)
  }

  next()
}
