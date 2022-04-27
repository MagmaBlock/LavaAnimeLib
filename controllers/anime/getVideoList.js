// 获取一个动画目录下的所有文件列表

const config = require('../../common/config');
const getPath = require('../tools/alistGetPath');

function getVideoList(req, res) {
    let reqId = req.params[0];
    if (isNaN(reqId)) {
        let response = { code: 400, message: 'ID 不是数字' }
        res.send(JSON.stringify(response));
        console.error('[发送错误]', response);
        return;
    }
    db.query(
        'SELECT * FROM anime WHERE id = ? AND deleted = 0',
        [reqId],
        function (error, result) {
            if (result.length == 0) {
                let response = { code: 404, message: 'ID 不存在' }
                res.send(JSON.stringify(response));
                console.error('[发送错误]', response);
                return;
            }
            let anime = result[0];
            getPath('/' + anime.year + '/' + anime.type + '/' + anime.name, (files) => {
                let videoList = new Array();
                for (let i = 0; i < files.length; i++) {
                    let thisFileType = 'file';
                    if (files[i].type == 1) {
                        thisFileType = 'dir'
                    }
                    let alistLink = config.alist.host + encodeURI('/d' + config.alist.root + '/' + anime.year + '/' + anime.type + '/' + anime.name + '/' + files[i].name)
                    let thisFile = {
                        name: files[i].name,
                        size: files[i].size,
                        time: files[i].updated_time,
                        type: thisFileType,
                        url: alistLink,
                        tempUrl: files[i].url
                    }
                    videoList.push(thisFile);
                }
                let response = { code: 200, message: '获取成功', data: videoList }
                res.send(JSON.stringify(response));
            }, false)
        }
    )

}

module.exports = {
    getVideoList
}