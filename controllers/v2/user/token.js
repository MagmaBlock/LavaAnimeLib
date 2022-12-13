import { createHash } from 'crypto';
import { promiseDB } from '../../../common/sql.js'
import cache from '../../../common/cache.js';

export function createToken() {
  let createTime = new Date()

  let tokenRaw = createTime * Math.floor(Math.random() * 1000) * Math.floor(Math.random() * 1000)
  let token = createHash('sha256')
    .update(tokenRaw.toString())
    .update(tokenRaw.toString())
    .digest('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
  return token
}

export async function saveToken(token, userID, expirationTime) {
  if (!token || !userID || !expirationTime) throw '参数错误'

  await promiseDB.query(
    'INSERT INTO token (token,`user`,expiration_time) VALUES (?,?,?)',
    [token, userID, expirationTime]
  )

  return
}

// token 的缓存，避免频繁查询数据库
// 当 token 注销被触发后，此处的缓存也会同时删除
let tokenCache = cache.token

// 使用 token 找到用户 ID
export async function useToken(token) {
  if (!token) return false

  if (tokenCache[token]) { // 缓存中有此 Token
    if (tokenCache[token].expirationTime > new Date()) { // 生效
      return tokenCache[token].user
    } else { // 过期
      return false
    }
  }

  let findReult = await promiseDB.query(
    'SELECT * FROM token WHERE token = ?',
    [token]
  )
  findReult = findReult[0]

  if (findReult[0]) { // 有结果
    if (findReult[0].status == 1 && findReult[0].expiration_time > new Date()) { // token 有效
      // 存缓存
      tokenCache[findReult[0].token] = {
        user: findReult[0].user,
        expirationTime: findReult[0].expiration_time
      }
      // 返回 userID
      return findReult[0].user
    } else { // token 失效
      return false
    }
  } else { // 数据库中无
    return false
  }
}


// 注销 token，可选注销同用户的所有 token，同时缓存也会被清理
export async function removeToken(token, all = false) {
  if (!token) throw '缺失参数'

  let userID = await useToken(token)
  if (userID) {
    if (all) { // 如果要求在所有设备登出
      // 删除缓存
      Object.keys(tokenCache).forEach(cache => {
        if (tokenCache[cache].user == userID) {
          delete tokenCache[cache]
        }
      })
      // 删除数据库
      await promiseDB.query('UPDATE token SET status = 0 WHERE user = ?', [userID])
      return true
    } else { // 仅注销当前 token
      // 删除缓存
      delete tokenCache[token]
      // 删除数据库
      await promiseDB.query('UPDATE token SET status = 0 WHERE user = ? AND token = ?', [userID, token])
      return true
    }
  }
  else {
    return false // 此 Token 本就不合法 / 失效, 无法删除以及用作登出的凭据
  }
}