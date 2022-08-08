
import notFound from "../error/notFound.js"
import serverError from "../error/serverError.js"
import wrongQuery from "../error/wrongQuery.js"
import { animeParser } from "../parser/animeParser.js"
import { getAnimeByID } from "./get.js"
import { addAnimeView, getAnimeView } from "./view.js"

export async function getAnimeByIDAPI(req, res) {
    let laID = req.query.id
    if (!isFinite(laID)) return wrongQuery(res)
    let full = req.query.full || false
    if (full) full = JSON.parse(req.query.full)

    try {
        let anime = await getAnimeByID(laID)
        if (anime.length == 0) return notFound(res)
        let thisAnimeData = (await animeParser(anime, full))[0]

        res.send({ code: 200, message: '成功', data: thisAnimeData })
    } catch (error) {
        console.error(error);
        return serverError(res)
    }
}

export async function getAnimeViewAPI(req, res) {
    let laID = req.query.id
    if (!isFinite(laID)) return wrongQuery(res)

    try {
        let animeView = await getAnimeView(laID)
        if (animeView >= 0) {
            res.send({
                code: 200,
                message: '成功',
                data: { views: animeView, id: laID }
            })
        } else if (animeView === false) {
            return notFound(res)
        } else {
            return serverError(res)
        }
    } catch (error) {
        console.error(error);
        return serverError(res)
    }

}



export async function addAnimeViewAPI(req, res) {
    let laID = req.body.id
    let ep = req.body.ep
    let file = req.body.file
    let ip = req.ip

    if (!isFinite(laID)) return wrongQuery(res)

    try {
        let addResult = await addAnimeView(laID, ep, file, ip)
        if (addResult) {
            res.send({
                code: 200, message: '成功',
                data: {
                    views: await getAnimeView(laID),
                    id: laID
                }
            })
        }
        else {
            return notFound(res)
        }
    } catch (error) {
        console.error(error);
        return serverError(res)
    }
}
