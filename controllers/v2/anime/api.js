
import config from "../../../common/config.js"
import notFound from "../response/4xx/notFound.js"
import serverError from "../response/5xx/serverError.js"
import wrongQuery from "../response/4xx/wrongQuery.js"
import { animeParser } from "../parser/animeParser.js"
import { getFilesByID } from "./file.js"
import { getAnimeByID, getAnimesByID } from "./get.js"
import { addAnimeView, getAnimeView } from "./view.js"
import success from "../response/2xx/success.js"

// GET /v2/anime/get
export async function getAnimeByIDAPI(req, res) {
    let laID = req.query.id
    if (!isFinite(laID)) return wrongQuery(res)
    let full = req.query.full || false
    if (full) full = JSON.parse(req.query.full)

    try {
        let anime = await getAnimeByID(laID)
        if (anime.length == 0) return notFound(res)
        let thisAnimeData = (await animeParser(anime, full))[0]

        success(res, thisAnimeData)
    } catch (error) {
        console.error(error);
        return serverError(res)
    }
}

// POST /v2/anime/get
export async function getAnimesByIDAPI(req, res) {
    let ids = req.body.ids
    if (!Array.isArray(ids) || ids.length >= 80) return wrongQuery(res)
    try {
        let result = await getAnimesByID(ids)
        result = await animeParser(result)
        success(res, result)
    } catch (error) {
        console.error(error);
        return serverError(res)
    }
}

// /v2/anime/file
export async function getFilesByIDAPI(req, res) {
    let laID = req.query.id
    let drive = req.query.drive || config.drive.default
    if (!isFinite(laID)) return wrongQuery(res)

    try {
        let files = await getFilesByID(laID, drive)
        if (!files) {
            return notFound(res)
        } else {
            success(res, files)
        }
    } catch (error) {
        console.error(error);
        return serverError(res)
    }
}

// /v2/anime/view/get
export async function getAnimeViewAPI(req, res) {
    let laID = req.query.id
    if (!isFinite(laID)) return wrongQuery(res)

    try {
        let animeView = await getAnimeView(laID)
        if (animeView >= 0) {
            return success(res, { views: animeView, id: laID })
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


// /v2/anime/view/add
export async function addAnimeViewAPI(req, res) {
    let laID = req.body.id
    let ep = req.body.ep
    let file = req.body.file
    let ip = req.ip
    let type = req.body.type

    if (!isFinite(laID)) return wrongQuery(res)

    try {
        let addResult = await addAnimeView(laID, ep, file, ip, null, type)
        if (addResult) {
            success(res, {
                views: await getAnimeView(laID),
                id: laID
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
