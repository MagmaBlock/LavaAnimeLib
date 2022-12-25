import { promiseDB } from "../../../common/sql.js";
import serverError from "../response/5xx/serverError.js";
import wrongQuery from "../response/4xx/wrongQuery.js";
import success from "../response/2xx/success.js";

// 获取头图相关数据
export async function getHeaderAPI(req, res) {
  try {
    let dbResult = await promiseDB.query(
      'SELECT * FROM settings WHERE `key` = \'headerData\''
    )
    if (dbResult[0].length == 0) {
      return success(res, [])
    }
    else {
      success(res, JSON.parse(dbResult[0][0].value))
    }
  } catch (error) {
    console.error(error);
    return serverError(res)
  }
}

// 更新头图相关数据，需 permission.admin
export async function updateHeaderAPI(req, res) {
  try {
    let newData = req.body.data
    // 必须为数组
    if (!Array.isArray(newData)) {
      return wrongQuery(res)
    }

    let dbResult = await promiseDB.query(
      'SELECT * FROM settings WHERE `key` = ?',
      ['headerData']
    )
    if (dbResult[0].length == 0) {
      await promiseDB.query(
        'INSERT INTO settings (`key`,value) VALUES (?,?)',
        ['headerData', JSON.stringify(newData)]
      )
    }
    else {
      await promiseDB.query(
        'UPDATE settings SET value=? WHERE `key`=?',
        [JSON.stringify(newData), 'headerData']
      )
    }

    success(res)
  } catch (error) {
    console.error(error);
    return serverError(res)
  }
}