/*
    索引页 API
*/

const { idHandler, textHandler } = require('./tools/textHandler');
const orderMonth = require('./tools/orderMonth');

function getYearList(req, res) { // 获取年份列表
    db.query(`SELECT \`year\` FROM anime GROUP BY \`year\` ORDER BY \`year\` DESC`, function (error, results) {
        if (error) throw error;
        if (results.length) {
            let yearList = [];
            for (i in results) {
                yearList.push(results[i].year);
            }
            let response = { code: 0, data: yearList };
            res.send(JSON.stringify(response));
        }
    })
}

function getMonthList(req, res) { // 获取对应年的月份(季度/类型列表)
    let year = textHandler(req.params[0])
    console.log(year);
    if (year == undefined) { // 如果年份不正常，则返回错误
        let response = { code: 400, message: '提供的年份有误、不合法或未提供!', data: '' };
        res.send(JSON.stringify(response));
        console.log('[发送错误]', response);
    }
    else {
        db.query(`SELECT \`month\` FROM anime WHERE \`year\` = '${year}' GROUP BY \`month\` ORDER BY \`month\``, function (error, results) {
            if (error) throw error;
            if (results.length) {
                let monthList = [];
                for (i in results) {
                    monthList.push(results[i].month);
                }
                let response = { code: 0, data: orderMonth(monthList) };
                res.send(JSON.stringify(response));
            }
        })
    }
}

function getAllMonthList(req, res) {
    db.query(`SELECT \`month\` FROM anime GROUP BY \`month\` ORDER BY \`month\``, function (error, results) {
        if (error) throw error;
        if (results.length) {
            let monthList = [];
            for (i in results) {
                monthList.push(results[i].month);
            }
            let response = { code: 0, data: orderMonth(monthList) };
            res.send(JSON.stringify(response));
        }
    })
}

module.exports = {
    getYearList,
    getMonthList,
    getAllMonthList
}