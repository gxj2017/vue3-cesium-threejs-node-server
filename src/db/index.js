'use strict'

/**
 * 数据持久化统一使用 MongoDB。
 * 登录/注册/用户信息等已有接口与后续新接口，请通过本模块访问集合：
 *   insert / findOne / find / updateOne / collection
 *
 * 环境变量：MONGODB_URI、MONGODB_DB_NAME（见 config）
 * 可选：DB_PATH 指向旧版 database.json，仅用于首次种子或 npm run db:import-admin
 */

const logger  = require('../utils/logger')
const mongoDb = require('./mongoDb')

async function initialize() {
  logger.info('[DB] 数据存储: MongoDB')
  await mongoDb.initialize()
}

module.exports = {
  initialize,
  close       : mongoDb.close,
  insert      : mongoDb.insert,
  findOne     : mongoDb.findOne,
  find        : mongoDb.find,
  updateOne   : mongoDb.updateOne,
  collection  : mongoDb.collection
}
