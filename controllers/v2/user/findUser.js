import { promiseDB } from "../../../common/sql.js"

export async function findUserByID(userID) {
  if (!userID) return false

  let findReult = await promiseDB.query(
    'SELECT * FROM user WHERE id = ?',
    [userID]
  )
  findReult = findReult[0]
  if (findReult[0]) {
    return findReult[0]
  } else {
    return false
  }
}