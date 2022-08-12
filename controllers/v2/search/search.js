import { promiseDB } from "../../../common/sql.js"
import { animeParser } from "../parser/animeParser.js"

export async function searchAnimes(value) {
    let splitedValue = value.split(' ')
    let query = 'SELECT * FROM anime WHERE '
    for (let i in splitedValue) {
        splitedValue[i] = '%' + splitedValue[i] + '%'
        query = query + `title LIKE ? AND `
    }
    query = query + 'deleted = 0 ORDER BY views DESC'

    let searchResults = await promiseDB.query(query, splitedValue)
    searchResults = await animeParser(searchResults[0])

    return searchResults
}