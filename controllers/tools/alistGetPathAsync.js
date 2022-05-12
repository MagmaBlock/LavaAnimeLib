const axios = require('axios');

const config = require('../../common/config');
const pathApi = config.alist.host + "/api/public/path"; // 请求路径的API

function getPathAsync(path = '/', debug = false) { // 传入路径和回调，获取路径下的文件夹和文件
    return new Promise(async (resolve, reject) => {
        let postBody = { "path": config.alist.root + path, "password": "1" }
        let result = await axios.post(pathApi, postBody);
        if (result.data.data !== null) { // 文件夹正常
            resolve(result.data.data.files); // 返回文件夹下的文件
        }
        else resolve([]);
    })
}


module.exports = { getPathAsync };