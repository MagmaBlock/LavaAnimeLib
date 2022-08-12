import { promiseDB } from "../../../common/sql.js";
import serverError from "../error/serverError.js";
import wrongQuery from "../error/wrongQuery.js";

import { animeParser } from "../parser/animeParser.js";

export default async function queryAnimeByIndex(req, res) {

    if (Object.keys(req.body).length == 0) return wrongQuery(res);

    let queryPlaceholder = [
        req.body.year || '%', req.body.type || '%'
    ]

    try {
        let queryResult = await promiseDB.query(
            'SELECT * FROM anime WHERE year LIKE ? AND `type` LIKE ? AND deleted = 0',
            queryPlaceholder
        )

        res.send({ code: 200, message: 'success', data: await animeParser(queryResult[0]) })
    } catch (error) {
        console.error(error);
        return serverError(res)
    }
}

