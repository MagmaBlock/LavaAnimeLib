/* 此脚本用于执行文件夹目录索引的定期同步，从Alist保存至MySQl。 */

const axios = require('axios');

const config = require('../common/config');
const pathApi = config.alist.host + "/api/public/path"; // 请求路径的API

require('../common/sql'); // For Debug

function getPath(path, callback) { // 传入路径和回调，获取路径下的文件夹和文件
    let postBody = { "path": config.alist.root + path, "password": "1" }
    axios.post(pathApi, postBody)
        .then((result) => {
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


// getYearIndex();

function getYearIndex() {
    getPath("", (files) => { // 从Alist获取年份列表
        let yearIndex = new Array()
        for (let i = 0; i < files.length; i++) {
            if (files[i].type == 1) { // 如果是文件夹再加入年份列表
                yearIndex.push(files[i].name)
            }
        }
        if (yearIndex.length != 0) { // 如果成功得到年份列表
            getTypeIndex(yearIndex); // 把年份索引传入 getTypeIndex 进行下一步
        }
    })
}

function getTypeIndex(yearIndex) { // 获取年份列表下的类型列表
    for (let i = 0; i < yearIndex.length; i++) {
        let thisYearName = yearIndex[i]
        getPath("/" + thisYearName, (files) => { // 获取 /20xx年 下的所有类型
            for (let j = 0; j < files.length; j++) {
                if (files[j].type == 1) { // 如果是文件夹，那么准备获取番剧列表
                    let thisTypeName = files[j].name;
                    getAnimeIndex(thisYearName, thisTypeName); // 把 20xx 年和 x月x 传入 getAnimeIndex 进行下一步
                }
            }
        })
    }
}

function getAnimeIndex(thisYearName, thisTypeName) {
    getPath("/" + thisYearName + "/" + thisTypeName, (files) => { // 获取 /20xx年/x月x 下的所有番剧
        for (let i = 0; i < files.length; i++) { // 遍历处理每个番剧
            let thisAnimeName = files[i].name;
            db.query(    // 查询是否已经存在于数据库
                'SELECT * FROM anime WHERE year=? AND type=? AND name = ?',
                [thisYearName, thisTypeName, thisAnimeName], // 占位符写法
                function (error, result) {
                    if (result == undefined || result.length == 0) { // 如果不存在，那么插入
                        console.log(`发现新番剧文件夹: ${thisYearName}/${thisTypeName}/${thisAnimeName}`);
                        db.query(
                            'INSERT INTO anime (\`year\`, \`type\`, name) VALUES (?, ?, ?)',
                            [thisYearName, thisTypeName, thisAnimeName], // 占位符写法
                            function (error, result) {
                                console.log(`插入成功: ${thisYearName}/${thisTypeName}/${thisAnimeName}`);
                            }
                        )
                    }
                })
        }
    })
}

checkDB()
function checkDB() {
    // 先检查数据库里有多少年份
    db.query(
        'select \`year\` from anime group by \`year\`',
        function (error, result) {
            let yearList = result;
            for (let i = 0; i < yearList.length; i++) {
                let DBthisYearName = yearList[i].year;
                checkDBType(DBthisYearName);
            }
        })

    // 检查此年份中有多少类型
    function checkDBType(DBthisYearName) {
        db.query(
            'select \`type\` from anime where \`year\` = ? group by \`type\`',
            [DBthisYearName],
            function (error, result) {
                let typeList = result;
                for (let i = 0; i < typeList.length; i++) {
                    let DBthisTypeName = typeList[i].type;
                    checkDBAnime(DBthisYearName, DBthisTypeName);
                }
            }
        )
    }

    // 检查此类型中有哪些番剧
    function checkDBAnime(DBthisYearName, DBthisTypeName) {
        db.query(
            'select id,name from anime where \`year\` = ? and \`type\` = ? and deleted = 0',
            [DBthisYearName, DBthisTypeName],
            function (error, result) {
                let DBthisTypeAnimeList = result;
                compareWithAlist(DBthisYearName, DBthisTypeName, DBthisTypeAnimeList);
            }
        )
    }

    // 比较 Alist 中的番剧列表和数据库中的番剧列表
    function compareWithAlist(DBthisYearName, DBthisTypeName, DBthisTypeAnimeList) {
        getPath(
            "/" + DBthisYearName + "/" + DBthisTypeName,
            (files) => {
                let AthisTypeAnimeList = files; // 拿到 Alist 的此分类番剧列表
                for (let i = 0; i < AthisTypeAnimeList.length; i++) { // 从Alist向数据库中找，剔除数据库中已有的
                    let AthisAnimeName = AthisTypeAnimeList[i].name;
                    for (let j = 0; j < DBthisTypeAnimeList.length; j++) { // 找数据库中和Alist一样的
                        let DBthisAnimeName = DBthisTypeAnimeList[j].name;
                        if (AthisAnimeName == DBthisAnimeName) {
                            DBthisTypeAnimeList.splice(j, 1); // 删除
                        }
                    }
                } // Alist 遍历完了，数据库若还有值，那么说明数据库里多了，需要删除
                if (DBthisTypeAnimeList.length != 0) {
                    console.log('发现遗失的番剧: ',DBthisTypeAnimeList);
                    for (let i = 0; i < DBthisTypeAnimeList.length; i++) {
                        db.query(
                            'UPDATE anime SET `deleted` = 1 WHERE id = ?',
                            [DBthisTypeAnimeList[i].id],
                            function (error, result) {
                                console.log('已添加遗失标签: ',DBthisTypeAnimeList[i].name);
                            }
                        )
                    }
                }
            })
    }
}