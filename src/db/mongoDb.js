'use strict'

/**
 * 本地 MongoDB 存储（官方 mongodb 驱动）
 * 集合名与 JSON 方案一致：users、login_logs、refresh_tokens
 */

const fs     = require('fs')
const path   = require('path')
const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const dayjs  = require('dayjs')
const config = require('../config')
const logger = require('../utils/logger')

/** 从 JSON 库文件读取 admin 文档（与 data/database.json 结构一致） */
function loadAdminFromJsonFile() {
  const jsonPath = path.resolve(process.cwd(), config.DB_PATH)
  if (!fs.existsSync(jsonPath)) return null
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    const row = data.users?.find(u => u.username === 'admin')
    if (!row) return null
    const doc = { ...row }
    delete doc._id
    return doc
  } catch {
    return null
  }
}

let client = null
let db = null

function getColl(name) {
  if (!db) throw new Error('数据库未初始化')
  return db.collection(name)
}

function toFilter(predicate) {
  if (typeof predicate === 'function') {
    throw new Error('MongoDB 模式下 findOne/find/updateOne 的 predicate 请使用对象条件，不支持函数')
  }
  return { ...predicate }
}

async function initialize() {
  client = new MongoClient(config.MONGODB_URI)
  await client.connect()
  db = client.db(config.MONGODB_DB_NAME)
  logger.info(`[DB] 已连接 MongoDB: ${config.MONGODB_URI} → 库 ${config.MONGODB_DB_NAME}`)

  const users = getColl('users')
  await users.createIndexes([
    { key: { username: 1 }, unique: true },
    { key: { id: 1 }, unique: true },
    {
      key: { email: 1 },
      unique: true,
      partialFilterExpression: { email: { $type: 'string' } }
    }
  ])

  const exists = await users.findOne({ username: 'admin' })
  if (!exists) {
    const fromJson = loadAdminFromJsonFile()
    if (fromJson) {
      await users.insertOne(fromJson)
      logger.info('[DB] 已从 database.json 将管理员写入 MongoDB（保持原密码哈希与 id）')
    } else {
      const hash = bcrypt.hashSync('admin123', config.BCRYPT_ROUNDS)
      const now  = dayjs().toISOString()
      await users.insertOne({
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
      logger.info('[DB] 已创建默认账号 admin / admin123')
    }
  }
}

async function close() {
  if (client) {
    await client.close()
    client = null
    db = null
    logger.info('[DB] MongoDB 连接已关闭')
  }
}

async function insert(collName, doc) {
  await getColl(collName).insertOne(doc)
  return doc
}

async function findOne(collName, predicate) {
  return await getColl(collName).findOne(toFilter(predicate))
}

async function find(collName, predicate) {
  return await getColl(collName).find(toFilter(predicate)).toArray()
}

async function updateOne(collName, predicate, updates) {
  const doc = await getColl(collName).findOneAndUpdate(
    toFilter(predicate),
    { $set: updates },
    { returnDocument: 'after' }
  )
  return doc || null
}

/** 与 JSON 方案导出签名一致；Mongo 下返回原生 Collection（当前业务未使用） */
async function collection(name) {
  return getColl(name)
}

module.exports = {
  initialize,
  close,
  insert,
  findOne,
  find,
  updateOne,
  collection
}
