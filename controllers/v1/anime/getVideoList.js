// 获取一个动画目录下的所有文件列表

import config from '../../../common/config.js';
import { getPathAsync } from '../tools/alistGetPath.js';
import { dbQueryAsync } from '../tools/dbQuery.js';

import { fileNameToTagedName, dict } from './fileNameToTagedName.js'

export async function getVideoList(req, res) {
    res.send({
        code: 200, message: 'API 过时', data: [
            {
                name: "当前客户端 / 网页使用的 API 已过期停止维护. 请开发者更新您的 API.",
                type: "file",
                url: "", tempUrl: ""
            },
            {
                name: "V1 的其他旧 API（如搜索和查询）也将在未来关闭，请使用新版.",
                type: "file",
                url: "", tempUrl: ""
            }
        ]
    });
    console.warn('');
    console.warn('[V1 API] 意料之外的前端请求了 V1 VideoList.', `\nReferer: ${req.get('Referer')}\nUA: ${req.get('user-agent')}`);
    console.warn('');
    return;

    let reqId = req.params[0];
    if (isNaN(reqId)) { // 首先验证是否为数字
        let response = { code: 400, message: 'ID 不是数字' }
        res.send(JSON.stringify(response));
        console.error('[发送错误]', response);
        return;
    }
    let dbData = (await dbQueryAsync('SELECT * FROM anime WHERE id = ? AND deleted = 0', [reqId]))[0];
    if (!dbData) { // 如果没有找到番剧数据
        let response = { code: 404, message: 'ID 不存在' }
        res.send(JSON.stringify(response));
        console.warn('[发送错误]', response);
        return;
    }
    let files = await getPathAsync('/' + dbData.year + '/' + dbData.type + '/' + dbData.name);
    let videoList = new Array();
    for (let i = 0; i < files.length; i++) {
        let thisFile = {
            name: files[i].name,
            size: files[i].size,
            time: files[i].updated_time,
            type: files[i].type == 1 ? 'dir' : 'file', // 1为目录
            url: config.alist.host + encodeURI('/d' + config.alist.root + '/' + dbData.year + '/' + dbData.type + '/' + dbData.name + '/' + files[i].name),
            tempUrl: files[i].url,
            tagedName: fileNameToTagedName(files[i].name, dict),
        }
        videoList.push(thisFile);
    }
    let response = { code: 200, message: `获取成功: ${dbData.name}`, data: videoList }
    res.send(JSON.stringify(response));
    console.info('[返回视频列表]', dbData.name);
}

