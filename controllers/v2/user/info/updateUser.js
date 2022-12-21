import cache from "../../../../common/cache.js"
import { promiseDB } from "../../../../common/sql.js"

// 修改用户数据
export async function updateUserData(data, userID) {
  if (!data || !userID) throw '未提供 userID'

  data = JSON.stringify(data)

  await promiseDB.query('UPDATE user SET `data` = ? WHERE id = ?', [data, userID])
  delete cache.user[userID]
}

// 修改用户设置
export async function updateUserSettings(settings, userID) {
  if (!settings || !userID) throw '未提供 userID'

  settings = JSON.stringify(settings)

  await promiseDB.query('UPDATE user SET `settings` = ? WHERE id = ?', [settings, userID])
  delete cache.user[userID]
}
