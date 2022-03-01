const axios = require('axios');
const fs = require('fs');
const path = require('path');

const cookiePath = path.join(__dirname, './tools/cookie.json');
const config = require('../common/config');

function getFileUrl(req, res) {
    let fileId = req.params[0];
    let cookie = fs.readFileSync(cookiePath).toString(); // 从文件缓存中读取cookie
    if (cookie.length > 0) {
        cookie = JSON.parse(cookie).cookie; // 解析JSON
    }
    axios.get('https://pan.5t5.top/api/v3/file/source/' + fileId, { // 请求文件地址
        headers: { cookie: cookie }
    }).then((ret) => {
        if (ret.data.code == 401) { // 如果cookie失效，则重新获取cookie
            console.log('[验证失败] Cookie 似乎过期了, 正在重新获取...');
            axios.post(`https://pan.5t5.top/api/v3/user/session`, config.cloudreve).then((ret) => {
                if (ret.data.code == 0) { // 获取cookie成功
                    console.log(`[登录成功] Cookie: ${JSON.stringify({ cookie: ret.headers['set-cookie'][0] })}`);
                    fs.writeFileSync(cookiePath, JSON.stringify({ cookie: ret.headers['set-cookie'][0] })); // 将cookie写入文件缓存
                    getFileUrl(req, res); // 重新获取文件地址
                    return;
                }
                else { // 获取cookie失败
                    let response = { code: 503, message: '向熔岩云盘获取文件时出现登录错误' }
                    console.log(`[获取直链] ${JSON.stringify(response)}`);
                    res.send(JSON.stringify(response));
                    return;
                }
            })
        }
        else if (ret.data.code == 0) { // cookie有效，并且获取文件地址成功
            let url = ret.data.data.url;
            let response = { code: 0, message: '获取成功', data: { url: url } }
            console.log(`[获取直链] 成功取得文件 ${fileId} 的直链`);
            res.send(JSON.stringify(response));
            return;
        }
        else if (ret.data.code == 40001) { // 文件不存在
            console.log('[错误] 文件不存在');
            let response = { code: 404, message: '找不到此文件或提供ID不合法' }
            console.log(`[获取直链] ${JSON.stringify(response)}`);
            res.send(JSON.stringify(response));
            return;
        }
        else {
            console.log('[错误] 获取文件地址失败');
            let response = { code: 503, message: '向熔岩云盘获取文件时出现登录错误' }
            console.log(`[获取直链] ${JSON.stringify(response)}`);
            res.send(JSON.stringify(response));
            return;
        }
    })
}

module.exports = {
    getFileUrl: getFileUrl
}