/*
    索引页 API
*/

const { idHandler, textHandler } = require('./tools/textHandler');
const orderType = require('./tools/orderType');  // 引入排序器

// require('../common/sql'); // For Debug

function getYearList(req, res) { // 获取年份列表
    db.query(
        `SELECT \`year\` FROM anime GROUP BY \`year\` ORDER BY \`year\` DESC`,
        function (error, results) {
            if (error) throw error;
            if (results.length > 0) {
                let yearList = new Array(); // 新建年份列表
                for (i in results) yearList.push(results[i].year); // 将年份添加到列表
                let response = { code: 0, data: yearList }; // 将列表发送给客户端
                res.send(JSON.stringify(response));
            }
            else {
                let response = { code: 400, data: '没有找到相关数据' };
                res.send(JSON.stringify(response));
            }
        }
    )
}

function getTypeList(req, res) { // 获取对应年的月份(季度/类型列表)
    let reqYear = req.params[0]; // 客户端请求的年份
    db.query(
        'SELECT * FROM anime WHERE year = ? ORDER BY ?',
        [reqYear, 'type'],
        function (error, results) {
            if (error) throw error;
            if (results.length > 0) {
                let typeList = new Array();
                for (i in results) {
                    typeList.push(results[i].type);
                }
                let response = { code: 0, data: orderType(typeList) };
                res.send(JSON.stringify(response));
            }
            else {
                let response = { code: 400, data: '没有找到相关数据' };
                res.send(JSON.stringify(response));
            }

        })
}


function getAnimeList(req, res) { // 获取对应年份和类型下的所有动画
    let index = req.body;
    let reqYear = index.year;
    let reqType = index.type;
    db.query(
        'SELECT * FROM anime WHERE year = ? AND type = ? AND deleted = 0 ORDER BY views DESC',
        [reqYear, reqType],
        function (error, results) {
            if (error) throw error;
            let animeList = results
            let response = { code: 0, data: animeList };
            res.send(JSON.stringify(response));
        }
    )

}

function getAllTypeList(req, res) { // 获取所有类型列表
    db.query(
        `SELECT \`type\` FROM anime GROUP BY \`type\``,
        function (error, results) {
            if (error) throw error;
            if (results.length) {
                let typeList = new Array();
                for (i in results) {
                    typeList.push(results[i].type);
                }
                let response = { code: 0, data: orderType(typeList) };
                res.send(JSON.stringify(response));
            }
        })
}


module.exports = {
    getYearList,
    getTypeList,
    getAnimeList,
    getAllTypeList
}