import { promiseDB } from "../../../common/sql.js"
import notFound from "../error/notFound.js"
import serverError from "../error/serverError.js"
import wrongQuery from "../error/wrongQuery.js"
import { simpleAnimeData } from "../parser/animeParser.js"

export async function getAnimeByID(req, res) {
    try {
        if (!req.query.id) return wrongQuery(res)
        let laID = req.query.id
        let full = req.query.full || false

        let anime = await promiseDB.query('SELECT * FROM anime WHERE id = ? AND deleted = 0', [laID])
        if (anime[0].length == 0) return notFound(res)
        let thisAnimeData = await simpleAnimeData(anime[0])

        res.send({ code: 200, message: '', data: thisAnimeData })
    } catch (error) {
        console.error(error);
        return serverError(res)
    }
}