import cache from "../../../common/cache.js"
import { promiseDB } from "../../../common/sql.js"

export async function findUserByID(userID) {
  if (!userID) return false

  if (cache.user?.[userID]) {
    return dbUserParser(cache.user[userID])
  }

  let findReult = await promiseDB.query(
    'SELECT * FROM user WHERE id = ?',
    [userID]
  )
  findReult = findReult[0]
  if (findReult[0]) {
    // cache
    if (!cache.user) cache.user = {}
    cache.user[userID] = findReult[0]
    cache.user[userID].expirationTime = new Date().getTime() + 1000 * 60 * 5 // 五分钟后过期
    return dbUserParser(findReult[0])
  } else {
    return false
  }
}

function dbUserParser(userData) {
  try {
    userData.data = JSON.parse(userData.data)
    userData.settings = JSON.parse(userData.settings)
  } catch (error) {
    return userData
  }
  return userData
}