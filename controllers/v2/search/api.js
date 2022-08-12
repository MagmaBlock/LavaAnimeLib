import serverError from "../error/serverError.js"
import wrongQuery from "../error/wrongQuery.js"
import { quickSearch, searchAnimes } from "./search.js"

export async function searchAnimesAPI(req, res) {
    let value = req.query.value
    if (!value || typeof value !== 'string') return wrongQuery(res)

    try {
        let searchResults = await searchAnimes(value)
        res.send({ code: 200, message: '成功', data: searchResults })
    } catch (error) {
        console.error(error);
        return serverError(res)
    }
}

export async function quickSearchAPI(req, res) {
    let value = req.query.value
    if (!value || typeof value !== 'string') return wrongQuery(res)

    try {
        let searchResults = await quickSearch(value)
        res.send({ code: 200, message: '成功', data: searchResults })
    } catch (error) {
        console.error(error);
        return serverError(res)
    }
}