import config from "../../../common/config.js";
import { promiseDB } from "../../../common/sql.js";
import serverError from "../error/serverError.js";
import unauthorized from "../error/unauthorized.js";
import wrongQuery from "../error/wrongQuery.js";

export async function getHeaderAPI(req, res) {
  try {
    let dbResult = await promiseDB.query('SELECT * FROM settings WHERE `key` = ?', ["headerData"])
    if (dbResult[0].length == 0) {
      return res.send({ code: 200, message: '', data: [] })
    }
    else {
      return res.send({ code: 200, message: '', data: JSON.parse(dbResult[0][0].value) })
    }
  } catch (error) {
    console.error(error);
    return serverError(res)
  }
}

export async function updateHeaderAPI(req, res) {
  try {
    let newData = req.body.data
    if (!req.body || !req.body.password || !Array.isArray(newData)) return wrongQuery(res)
    if (req.body.password !== config.adminPassword) return unauthorized(res)

    let dbResult = await promiseDB.query('SELECT * FROM settings WHERE `key` = ?', ['headerData'])
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

    res.send({ code: 200, message: 'success' })
  } catch (error) {
    console.error(error);
    return serverError(res)
  }

}