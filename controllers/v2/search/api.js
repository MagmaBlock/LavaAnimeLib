import serverError from "../error/serverError.js"
import wrongQuery from "../error/wrongQuery.js"
import { searchAnimes } from "./search.js"

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