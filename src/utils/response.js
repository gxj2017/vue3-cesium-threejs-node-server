'use strict'

/**
 * 统一响应工具
 *
 * 业务状态码约定：
 *   0    → 成功
 *   400  → 请求参数错误
 *   401  → 未授权 / token 失效
 *   403  → 禁止访问
 *   404  → 资源不存在
 *   409  → 资源冲突（用户名已存在等）
 *   500  → 服务器错误
 */

/**
 * 构造响应体
 */
function buildResponse(code, data, message) {
  return {
    code,
    success : code === 0,
    data    : data !== undefined ? data : null,
    message : message || (code === 0 ? 'success' : 'fail'),
    timestamp: Date.now()
  }
}

/**
 * 成功响应  code=0
 */
function success(res, data, message = 'success', httpStatus = 200) {
  return res.status(httpStatus).json(buildResponse(0, data, message))
}

/**
 * 失败响应
 */
function fail(res, code = 500, message = '服务器内部错误', data = null, httpStatus) {
  // HTTP 状态码映射
  const statusMap = { 400: 400, 401: 401, 403: 403, 404: 404, 409: 409, 500: 500 }
  const status = httpStatus || statusMap[code] || 400
  return res.status(status).json(buildResponse(code, data, message))
}

module.exports = { success, fail, buildResponse }
