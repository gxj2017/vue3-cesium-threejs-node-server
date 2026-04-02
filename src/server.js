'use strict'

require('dotenv').config()

const app    = require('./app')
const config = require('./config')
const logger = require('./utils/logger')
const db     = require('./db')

let server = null

async function bootstrap() {
  await db.initialize()

  server = app.listen(config.PORT, config.HOST, () => {
    const host = config.HOST === '0.0.0.0' ? 'localhost' : config.HOST
    logger.info(`🚀 服务已启动 → http://${host}:${config.PORT}`)
    logger.info(`📝 接口文档    → http://localhost:${config.PORT}/api-docs`)
    logger.info(`🌍 运行环境    → ${process.env.NODE_ENV}`)
  })
}

bootstrap().catch((err) => {
  logger.error('服务启动失败', err)
  process.exit(1)
})

// ─── 优雅关闭 ───────────────────────────────────────────────
function gracefulShutdown(signal) {
  logger.info(`收到 ${signal} 信号，正在优雅关闭服务...`)
  if (!server) {
    process.exit(0)
    return
  }
  server.close(async () => {
    logger.info('HTTP 服务已关闭')
    try {
      await db.close()
    } catch (e) {
      logger.error('关闭数据库时出错', e)
    }
    process.exit(0)
  })
  // 超时强制退出
  setTimeout(() => {
    logger.error('强制退出（超时）')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT',  () => gracefulShutdown('SIGINT'))

// ─── 未捕获异常兜底 ──────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', err)
  process.exit(1)
})
process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', reason)
})
