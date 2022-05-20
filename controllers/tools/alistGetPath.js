import axios from 'axios';

import config from '../../common/config.js';
const pathApi = config.alist.host + "/api/public/path"; // 请求路径的API

export function getPath(path, callback, debug) { // 传入路径和回调，获取路径下的文件夹和文件
    let postBody = { "path": config.alist.root + path, "password": "1" }
    axios.post(pathApi, postBody)
        .then((result) => {
            if (debug) { console.log(result.data); } // 调试用
            if (result.data.code == 200) { // 请求成功
                callback(result.data.data.files);
            }
            if (result.data.code == 500 && result.data.message == 'path not found') { // 文件夹不存在
                callback([]);
            }
        })
        .catch((error) => {
            throw error;
        })
}

export function getPathAsync(path = '/', debug = false) { // 传入路径和回调，获取路径下的文件夹和文件
    return new Promise(async (resolve, reject) => {
        let postBody = { "path": config.alist.root + path, "password": config.alist.password }
        let result = await axios.post(pathApi, postBody);
        if (result.data.data !== null) { // 文件夹正常
            resolve(result.data.data.files); // 返回文件夹下的文件
        }
        else resolve([]);
    })
}