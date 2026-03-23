'use strict'

/**
 * 轻量级 JSON 文件数据库
 * ─────────────────────────────────────────────────────────────
 * 基于 Node.js fs 模块，纯 JS 实现，零原生编译依赖。
 * 生产环境可平滑迁移到 SQLite / MySQL / PostgreSQL。
 *
 * 设计原则：
 *   - 读取：同步（快速，内存缓存）
 *   - 写入：同步（原子写 + 临时文件交换，防止写一半崩溃丢数据）
 *   - 并发：单进程下安全；多进程请使用真实数据库
 */

const fs     = require('fs')
const path   = require('path')
const config = require('../config')
const logger = require('../utils/logger')

// ── 数据库文件路径 ────────────────────────────────────────────
const DB_DIR  = path.resolve(path.dirname(config.DB_PATH))
const DB_FILE = path.resolve(config.DB_PATH)

// ── 内存缓存 ─────────────────────────────────────────────────
let _cache = null

// ── 默认数据结构 ──────────────────────────────────────────────
function defaultStore() {
  return {
    users         : [],   // 用户集合
    refresh_tokens: [],   // 刷新令牌集合
    login_logs    : [],   // 登录日志集合
    _seq          : 0     // 自增序列
  }
}

// ── 初始化 ────────────────────────────────────────────────────
function initialize() {
  // 确保目录存在
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      _cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
      // 兼容旧结构
      if (!_cache.users)          _cache.users          = []
      if (!_cache.refresh_tokens) _cache.refresh_tokens = []
      if (!_cache.login_logs)     _cache.login_logs     = []
      if (!_cache._seq)           _cache._seq           = 0
      logger.info(`[DB] 已加载数据库: ${DB_FILE}`)
    } catch (e) {
      logger.warn(`[DB] 数据库文件损坏，重新初始化: ${e.message}`)
      _cache = defaultStore()
      _flush()
    }
  } else {
    _cache = defaultStore()
    _flush()
    logger.info(`[DB] 已创建数据库: ${DB_FILE}`)
  }

  // 种子数据
  const bcrypt = require('bcryptjs')
  const { v4: uuidv4 } = require('uuid')
  const dayjs  = require('dayjs')

  const exists = _cache.users.find(u => u.username === 'admin')
  if (!exists) {
    const hash = bcrypt.hashSync('admin123', config.BCRYPT_ROUNDS)
    const now  = dayjs().toISOString()
    _cache.users.push({
      id         : uuidv4(),
      username   : 'admin',
      password   : hash,
      nickname   : '管理员',
      email      : null,
      phone      : null,
      avatar     : null,
      roles      : ['admin', 'user'],
      permissions: ['*'],
      status     : 1,
      create_time: now,
      update_time: now
    })
    _flush()
    logger.info('[DB] 已创建默认账号 admin / admin123')
  }
}

// ── 原子写盘 ──────────────────────────────────────────────────
function _flush() {
  const tmp = DB_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(_cache, null, 2), 'utf8')
  fs.renameSync(tmp, DB_FILE)   // 原子替换
}

// ── 获取集合（引用） ──────────────────────────────────────────
function collection(name) {
  if (!_cache) throw new Error('数据库未初始化')
  if (!_cache[name]) _cache[name] = []
  return _cache[name]
}

/**
 * 在集合中插入一条记录
 */
function insert(collName, doc) {
  const col = collection(collName)
  col.push(doc)
  _flush()
  return doc
}

/**
 * 查找一条记录
 * @param {string} collName
 * @param {function|object} predicate - 函数或 key-value 对象
 */
function findOne(collName, predicate) {
  const col = collection(collName)
  const fn = typeof predicate === 'function'
    ? predicate
    : (doc) => Object.keys(predicate).every(k => doc[k] === predicate[k])
  return col.find(fn) || null
}

/**
 * 查找多条记录
 */
function find(collName, predicate) {
  const col = collection(collName)
  const fn = typeof predicate === 'function'
    ? predicate
    : (doc) => Object.keys(predicate).every(k => doc[k] === predicate[k])
  return col.filter(fn)
}

/**
 * 更新一条记录
 * @returns {object|null} 更新后的文档
 */
function updateOne(collName, predicate, updates) {
  const col = collection(collName)
  const fn = typeof predicate === 'function'
    ? predicate
    : (doc) => Object.keys(predicate).every(k => doc[k] === predicate[k])
  const idx = col.findIndex(fn)
  if (idx === -1) return null
  Object.assign(col[idx], updates)
  _flush()
  return col[idx]
}

/**
 * 关闭（JSON 方案无需操作）
 */
function close() {
  if (_cache) {
    _flush()
  }
  logger.info('[DB] 数据库已保存关闭')
}

module.exports = { initialize, close, insert, findOne, find, updateOne, collection }
