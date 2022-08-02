import { AlistAPI } from "../../../common/api.js";

export default async function alistGetter(path = '/1A/LavaAnimeLib/') {

    let files = await AlistAPI.post('/api/public/path', {
        'path': path
    })

    return files.data

}
