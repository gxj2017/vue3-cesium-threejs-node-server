'use strict'

/**
 * 404 处理中间件 —— 放在所有路由之后
 */
module.exports = function notFound(req, res) {
  res.fail(404, `接口不存在: ${req.method} ${req.originalUrl}`)
}
