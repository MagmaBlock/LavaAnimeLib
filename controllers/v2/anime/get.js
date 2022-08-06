import { promiseDB } from "../../../common/sql.js"
import notFound from "../error/notFound.js"
import serverError from "../error/serverError.js"
import wrongQuery from "../error/wrongQuery.js"
import { animeParser } from "../parser/animeParser.js"

export async function getAnimeByID(req, res) {
    try {
        if (!req.query.id) return wrongQuery(res)
        let laID = req.query.id
        let full = req.query.full || false
        if (full) full = JSON.parse(req.query.full)

        let anime = await promiseDB.query('SELECT * FROM anime WHERE id = ? AND deleted = 0', [laID])
        if (anime[0].length == 0) return notFound(res)
        let thisAnimeData = await animeParser(anime[0], full)

        res.send({ code: 200, message: '', data: thisAnimeData })
    } catch (error) {
        console.error(error);
        return serverError(res)
    }
}