import { AlistAPI } from "../../../common/api.js";
import config from "../../../common/config.js";

export default async function alistGetter(path = config.alist.root) {

    let files = await AlistAPI.post('/api/fs/list', {
        'path': path
    })

    return files.data

}
