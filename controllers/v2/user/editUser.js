import cache from "../../../common/cache.js"
import { promiseDB } from "../../../common/sql.js"
import forbidden from "../error/forbidden.js"
import serverError from "../error/serverError.js"
import wrongQuery from "../error/wrongQuery.js"
import { findUserByID } from "./findUser.js"

// 修改用户的权限
// 暂时没啥用
export async function updateUserPermissionAPI(req, res) {
  let { permission, userID } = req.body
  if (!permission || !userID) return wrongQuery(res)
  // 权限检查
  let user = findUserByID(userID)
  if (!user?.data?.permission?.admin) {
    return forbidden(res)
  }

  try {
    await updateUserData(permission, userID)
    res.send({ code: 200, message: '成功' })
  } catch (error) {
    return serverError(res)
  }
}


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
