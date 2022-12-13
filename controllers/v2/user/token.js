import { createHash } from 'crypto';
import { promiseDB } from '../../../common/sql.js'

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
let tokenCache = {
  /*
  'token': {
    user: ...,
    expirationTime: ...
  } 
  */
}

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