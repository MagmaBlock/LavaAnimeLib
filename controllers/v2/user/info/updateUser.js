import cache from "../../../../common/cache.js"
import { promiseDB } from "../../../../common/sql.js"

/**
 * 修改用户数据
 * @param {Object} data 此用户的元数据, 注意更新为覆盖！
 * @param {Number} userID 用户的 ID
 */
export async function updateUserData(data, userID) {
  if (!data || !userID) throw '未提供 userID'

  data = JSON.stringify(data)

  await promiseDB.query('UPDATE user SET `data` = ? WHERE id = ?', [data, userID])
  delete cache.user[userID]
}

/**
 * 修改用户设置
 * @param {Object} settings 通常为用户的个人配置, 从前端提交来的不受信数据
 * @param {Number} userID 
 */
export async function updateUserSettings(settings, userID) {
  if (!settings || !userID) throw '未提供 userID'

  settings = JSON.stringify(settings)

  await promiseDB.query('UPDATE user SET `settings` = ? WHERE id = ?', [settings, userID])
  delete cache.user[userID]
}
