/*
    索引页 API
*/

import db from '../../common/sql.js';
import { dbQueryAsync } from '../v1/tools/dbQuery.js';
import { orderType } from './tools/orderType.js';  // 引入排序器

export async function getYearList(req, res) { // 获取年份列表
    let yearListDB = await dbQueryAsync(`SELECT DISTINCT year FROM anime ORDER BY year DESC`);
    if (yearListDB.length > 0) {
        let yearList = new Array();
        for (let i in yearListDB) { // 这里拿到的一个数组里面包了一堆对象，得将其转换成单纯的数组
            yearList.push(yearListDB[i].year);
        }
        let response = { code: 0, data: yearList };
        res.send(response);
    }
    else {
        let response = { code: 500, data: [], message: '服务器错误' };
        res.send(response);
    }
}

export async function getTypeList(req, res) { // 获取对应年的月份(季度/类型列表)
    let reqYear = req.params[0]; // 客户端请求的年份
    let typeListDB = await dbQueryAsync('SELECT * FROM anime WHERE year = ? ORDER BY ?', [reqYear, 'type'])
    if (typeListDB.length > 0) {
        let typeList = new Array();
        for (let i in typeListDB) { // 这里拿到的一个数组里面包了一堆对象，得将其转换成单纯的数组
            typeList.push(typeListDB[i].type);
        }
        let response = { code: 0, data: orderType(typeList) };
        res.send(response);
    }
    else {
        let response = { code: 0, data: [], message: 'no data' };
        res.send(response);
    }
}


export function getAnimeList(req, res) { // 获取对应年份和类型下的所有动画
    let index = req.body;
    let reqYear = index.year;
    let reqType = index.type;
    db.query(
        'SELECT * FROM anime WHERE year = ? AND type = ? AND deleted = 0 ORDER BY views DESC',
        [reqYear, reqType],
        function (error, results) {
            if (error) throw error;
            let animeList = results;
            let response = { code: 0, data: animeList };
            res.send(JSON.stringify(response));
        }
    )

}

export function getAllTypeList(req, res) { // 获取所有类型列表
    db.query(
        `SELECT DISTINCT \`type\` FROM anime ORDER BY \`type\``,
        function (error, results) {
            if (error) throw error;
            if (results.length) {
                let typeList = new Array();
                for (let i in results) {
                    typeList.push(results[i].type);
                }
                let response = { code: 0, data: orderType(typeList) };
                res.send(JSON.stringify(response));
            }
        })
}