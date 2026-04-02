'use strict'

const { v4: uuidv4 } = require('uuid')
const dayjs          = require('dayjs')
const db             = require('../db')

const COLL = 'users'
const LOG_COLL = 'login_logs'

/**
 * 将内部存储行转换为对外暴露的用户对象（剔除 password）
 * roles/permissions 存储时始终是 JS Array（JSON.stringify 会保留数组结构）
 */
function rowToUser(row) {
  if (!row) return null
  // 兼容两种情况：Array（正常）或 string（迁移旧数据时）
  const toArr = (v) => {
    if (Array.isArray(v)) return v
    if (typeof v === 'string') {
      try { return JSON.parse(v) } catch { return v.split(',').map(s => s.trim()) }
    }
    return []
  }
  return {
    id         : row.id,
    username   : row.username,
    nickname   : row.nickname   || null,
    email      : row.email      || null,
    phone      : row.phone      || null,
    avatar     : row.avatar     || null,
    roles      : toArr(row.roles),
    permissions: toArr(row.permissions),
    status     : row.status,
    createTime : row.create_time,
    updateTime : row.update_time
  }
}

/**
 * 查询原始行（含 password），仅登录鉴权内部使用
 */
async function findRawByUsername(username) {
  return (await db.findOne(COLL, { username })) || null
}

/**
 * 根据 ID 查询（不含密码）
 */
async function findById(id) {
  const row = await db.findOne(COLL, { id })
  return rowToUser(row)
}

/**
 * 根据用户名查询（不含密码）
 */
async function findByUsername(username) {
  const row = await db.findOne(COLL, { username })
  return rowToUser(row)
}

/**
 * 根据邮箱查询（不含密码）
 */
async function findByEmail(email) {
  if (!email) return null
  const row = await db.findOne(COLL, { email })
  return rowToUser(row)
}

/**
 * 创建用户
 * @param {object} data - { username, passwordHash, email?, phone?, nickname? }
 * @returns {object} 新用户（不含密码）
 */
async function create(data) {
  const now = dayjs().toISOString()
  const id  = uuidv4()
  const doc = {
    id,
    username   : data.username,
    password   : data.passwordHash,
    nickname   : data.nickname || null,
    email      : data.email    || null,
    phone      : data.phone    || null,
    avatar     : null,
    roles      : data.roles       || ['user'],
    permissions: data.permissions || [],
    status     : 1,
    create_time: now,
    update_time: now
  }
  await db.insert(COLL, doc)
  return findById(id)
}

/**
 * 更新用户信息（不含密码）
 */
async function updateById(id, fields) {
  const now = dayjs().toISOString()
  const allowed = ['nickname', 'email', 'phone', 'avatar', 'status']
  const updates = { update_time: now }
  for (const key of allowed) {
    if (fields[key] !== undefined) updates[key] = fields[key]
  }
  await db.updateOne(COLL, { id }, updates)
  return findById(id)
}

/**
 * 更新密码
 */
async function updatePassword(id, newPasswordHash) {
  const now = dayjs().toISOString()
  await db.updateOne(COLL, { id }, { password: newPasswordHash, update_time: now })
}

/**
 * 写入登录日志
 */
async function addLoginLog(userId, ip, userAgent, status = 'success') {
  try {
    const now = dayjs().toISOString()
    await db.insert(LOG_COLL, {
      id        : Date.now() + Math.random(),
      user_id   : userId,
      ip        : ip || '',
      user_agent: userAgent || '',
      status,
      created_at: now
    })
  } catch {
    // 日志失败不影响主流程
  }
}

module.exports = {
  findRawByUsername,
  findById,
  findByUsername,
  findByEmail,
  create,
  updateById,
  updatePassword,
  addLoginLog
}
