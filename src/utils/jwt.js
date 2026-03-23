'use strict'

const jwt    = require('jsonwebtoken')
const config = require('../config')

/**
 * 签发 Access Token
 */
function signToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn : config.JWT_EXPIRES_IN,
    issuer    : 'vue3-cesium-threejs'
  })
}

/**
 * 签发 Refresh Token
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn : config.JWT_REFRESH_EXPIRES_IN,
    issuer    : 'vue3-cesium-threejs'
  })
}

/**
 * 验证 Access Token
 * @returns {object} decoded payload
 * @throws  {Error}  token 非法或过期
 */
function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET, {
    issuer: 'vue3-cesium-threejs'
  })
}

/**
 * 验证 Refresh Token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET, {
    issuer: 'vue3-cesium-threejs'
  })
}

/**
 * 从请求头提取 Bearer Token
 */
function extractBearerToken(req) {
  const auth = req.headers.authorization || ''
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7)
  }
  return null
}

module.exports = { signToken, signRefreshToken, verifyToken, verifyRefreshToken, extractBearerToken }
