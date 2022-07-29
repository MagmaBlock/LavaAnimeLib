import db from '../../../common/sql.js'

export function dbQueryAsync(sql, values) {
    return new Promise(function (resolve, reject) {
        db.query(
            sql,
            values,
            function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            }
        )
    })
}