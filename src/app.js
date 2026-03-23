'use strict'

const express      = require('express')
const cors         = require('cors')
const helmet       = require('helmet')
const morgan       = require('morgan')
const compression  = require('compression')
const path         = require('path')

const { CORS_ORIGINS } = require('./config')
const globalLimiter    = require('./middlewares/rateLimiter')
const errorHandler     = require('./middlewares/errorHandler')
const notFound         = require('./middlewares/notFound')
const respond          = require('./middlewares/respond')

// ─── 路由 ─────────────────────────────────────────────────
const authRouter   = require('./routes/auth')
// 后续按需挂载更多路由，例如：
// const userRouter = require('./routes/user')

const app = express()

// ─── 安全头 ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// ─── CORS ─────────────────────────────────────────────────
const allowedOrigins = CORS_ORIGINS
  ? CORS_ORIGINS.split(',').map(o => o.trim())
  : []

app.use(cors({
  origin (origin, cb) {
    // 无 origin（服务端请求、curl 等）直接放行
    if (!origin) return cb(null, true)
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return cb(null, true)
    }
    cb(new Error(`CORS 不允许来源: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}))

// ─── 通用中间件 ───────────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// ─── 日志 ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ─── 全局限流 ─────────────────────────────────────────────
app.use(globalLimiter)

// ─── 统一响应方法挂载（res.success / res.fail） ───────────
app.use(respond)

// ─── 接口文档静态文件 ──────────────────────────────────────
app.use('/api-docs', express.static(path.join(__dirname, '../docs')))

// ─── 健康检查 ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), env: process.env.NODE_ENV })
})

// ─── 业务路由 ─────────────────────────────────────────────
app.use('/auth', authRouter)
// app.use('/user', userRouter)

// ─── 404 & 错误处理 ───────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

module.exports = app
