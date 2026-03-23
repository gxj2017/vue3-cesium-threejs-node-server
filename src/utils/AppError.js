'use strict'

/**
 * 业务自定义错误类，统一错误形态方便 errorHandler 识别
 */
class AppError extends Error {
  /**
   * @param {string} message   - 错误信息
   * @param {number} code      - 业务状态码（400/401/403/404/409/500）
   * @param {*}      [data]    - 附加数据
   */
  constructor(message, code = 500, data = null) {
    super(message)
    this.name    = 'AppError'
    this.code    = code
    this.data    = data
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = AppError
