import serverError from "../response/5xx/serverError.js"
import wrongQuery from "../response/4xx/wrongQuery.js"
import { quickSearch, searchAnimes } from "./search.js"
import success from "../response/2xx/success.js"

export async function searchAnimesAPI(req, res) {
    let value = req.query.value
    if (!value || typeof value !== 'string') return wrongQuery(res)

    try {
        let searchResults = await searchAnimes(value)
        success(res, searchResults)
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
        success(res, searchResults)
    } catch (error) {
        console.error(error);
        return serverError(res)
    }
}