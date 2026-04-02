'use strict'

/**
 * 将 database.json（路径由 config.DB_PATH 决定）中的 admin 强制同步到 MongoDB（覆盖同 username）
 * 用法（项目根目录，需本机 Mongo 已启动且 .env 中 MONGODB_URI 正确）：
 *   npm run db:import-admin
 */

require('dotenv').config()

const fs     = require('fs')
const path   = require('path')
const { MongoClient } = require('mongodb')

const config = require('../src/config')

async function main() {
  const jsonPath = path.resolve(process.cwd(), config.DB_PATH)
  if (!fs.existsSync(jsonPath)) {
    console.error('未找到 JSON 库文件:', jsonPath)
    process.exit(1)
  }

  let data
  try {
    data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  } catch (e) {
    console.error('读取 JSON 失败:', e.message)
    process.exit(1)
  }

  const admin = data.users?.find(u => u.username === 'admin')
  if (!admin) {
    console.error('database.json 中不存在 username 为 admin 的用户')
    process.exit(1)
  }

  const doc = { ...admin }
  delete doc._id

  const client = new MongoClient(config.MONGODB_URI)
  await client.connect()
  const db = client.db(config.MONGODB_DB_NAME)
  const users = db.collection('users')

  await users.createIndexes([
    { key: { username: 1 }, unique: true },
    { key: { id: 1 }, unique: true },
    {
      key: { email: 1 },
      unique: true,
      partialFilterExpression: { email: { $type: 'string' } }
    }
  ])

  const r = await users.replaceOne({ username: 'admin' }, doc, { upsert: true })
  console.log(
    '管理员已写入 MongoDB 库',
    config.MONGODB_DB_NAME,
    '| matched:',
    r.matchedCount,
    'modified:',
    r.modifiedCount,
    'upsertedId:',
    r.upsertedId || '-'
  )

  await client.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
