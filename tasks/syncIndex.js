/* 此脚本用于执行文件夹目录索引的定期同步，从Alist保存至MySQl，然后完成一些番剧信息的刷新 */

require('../common/sql'); // For Debug

const getPath = require('../controllers/tools/alistGetPath');
const axios = require('axios');

syncDB();

function syncDB() {
    getYearIndex()
}

function getYearIndex() {
    getPath("", (files) => { // 从Alist获取年份列表
        let yearIndex = new Array()
        for (let i = 0; i < files.length; i++) {
            if (files[i].type == 1) { // 如果是文件夹再加入年份列表
                yearIndex.push(files[i].name)
            }
        }
        if (yearIndex.length != 0) { // 如果成功得到年份列表
            console.log(`[同步] 年份列表获取成功，共 ${yearIndex.length} 个年份`);
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

setTimeout(() => {
    checkDB();
    console.log("[同步] 完成，开始检查是否有番剧被删除");
}, 5000);

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
                    console.log('发现遗失的番剧: ', DBthisTypeAnimeList);
                    for (let i = 0; i < DBthisTypeAnimeList.length; i++) {
                        db.query(
                            'UPDATE anime SET `deleted` = 1 WHERE id = ?',
                            [DBthisTypeAnimeList[i].id],
                            function (error, result) {
                                console.log('已添加遗失标签: ', DBthisTypeAnimeList[i].name);
                            }
                        )
                    }
                }
            })
    }
}

setTimeout(() => {
    console.log("[检查] 完成，开始分割文件夹名称");
    cutBgmId();
}, 10000);


function cutBgmId() {
    db.query(
        'SELECT * FROM anime WHERE bgmid is null',
        function (error, result) {
            let noBgmIdList = result;
            for (let i = 0; i < noBgmIdList.length; i++) {
                let thisAnimeId = noBgmIdList[i].id;
                let thisAnimeDirName = noBgmIdList[i].name;
                let thisAnimeBgmId = thisAnimeDirName.match("\\d+$")[0];
                let thisAnimeTitle = thisAnimeDirName.replace(thisAnimeBgmId, "")
                thisAnimeTitle = thisAnimeTitle.substring(0, thisAnimeTitle.length - 1);
                db.query(
                    'UPDATE anime SET bgmid = ?, title = ? WHERE id = ?',
                    [thisAnimeBgmId, thisAnimeTitle, thisAnimeId],
                    function (error, result) {
                        console.log(`成功分割番剧名: ${thisAnimeTitle} - ${thisAnimeBgmId}`);
                    }
                )
            }
        }
    )
}

setTimeout(() => {
    console.log("[分割] 完成，开始更新番剧信息表");
    insertBgmId()
}, 15000);

function insertBgmId() { // 从 anime 表读取数据，向 bangumi_data 表插入新的 Bangumi ID。
    db.query(
        'SELECT bgmid FROM anime where deleted = \'0\'',
        function (error, result) {
            let bgmIdList = result;
            for (let i = 0; i < bgmIdList.length; i++) {
                let thisBgmId = bgmIdList[i].bgmid;
                db.query(
                    'SELECT * FROM bangumi_data WHERE bgmid = ?',
                    [thisBgmId],
                    function (error, result) {
                        if (result.length == 0) {
                            db.query(
                                'INSERT INTO bangumi_data (bgmid) VALUES (?)',
                                [thisBgmId],
                                function (error, result) {
                                    console.log(`数据库新建了 bgm${thisBgmId} 的行`);
                                }
                            )
                        }
                    }
                )
            }
        }
    )
}

setTimeout(() => {
    console.log("[更新] 完成，开始更新 Bangumi 数据");
    updataAllBgm()
}, 20000);


function updataAllBgm() { // 更新和 Bangumi API 相关的数据 (但不含相关番剧信息)
    db.query(
        'SELECT id,bgmid FROM anime',
        function (error, result) {
            let animeList = result;
            for (let i = 0; i < animeList.length; i++) {
                let executeTime = i * 100; // 每个抓取间隔
                let thisBgmId = animeList[i].bgmid;
                let thisId = animeList[i].id;
                getBgm( // 调用 getBgm 函数, 获取 Bgm API Data
                    thisBgmId, // 传入 Bangumi ID
                    (bgmData) => {
                        // console.log(bgmData);
                        if (bgmData.length == 0) {
                            let thisAnimePoster = 'https://anime-img.5t5.top/assets/noposter.png' // 占位图，给没有海报的番剧使用
                        } else {
                            let thisAnimePoster = bgmData.images.large.replace("lain.bgm.tv", "anime-img.5t5.top") + '/poster'; // 处理海报地址
                            let thisAnimeNSFW = bgmData.nsfw // 是否是 NSFW 的番剧
                            db.query( // 更新数据库
                                'UPDATE anime SET poster = ?, nsfw = ? WHERE id = ?',
                                [thisAnimePoster, thisAnimeNSFW, thisId],
                                function (error, result) {
                                    // console.log(result);
                                    if (result.message.match('Rows matched: 1  Changed: 1')) {
                                        console.log(`更新了新的番剧数据: la${thisId} => ${thisAnimePoster}, nsfw: ${thisAnimeNSFW}`);
                                    }
                                    else {
                                        console.log(`UPDATE la${thisId} 结果 ${result.message}`);
                                    }
                                }
                            )
                        }
                    },
                    executeTime // 传入延迟时间
                );

            }
        }
    )
}

function getBgm(bgmId, callback, executeTime) { // 获取 Bangumi 数据并返回的函数, 自带异步延迟
    setTimeout(() => { // 异步延迟执行
        // console.log(`在 ${executeTime}ms 后执行了 bgm${bgmId} 的抓取`);

        if (bgmId == 0) { // 如果 Bangumi ID 是 000000 或者不存在，直接填占位图
            callback([]);
        }
        else {
            axios({
                method: 'get',
                url: 'https://bgm-api.5t5.top/v0/subjects/' + bgmId,
            })
                .then((result) => {
                    let bgmData = result.data;
                    if (bgmData.images.large) {
                        callback(bgmData); // 返回 Bangumi Data
                    }
                })
                .catch(error => { })
        }
    }, executeTime);
}

setTimeout(() => {
    console.log("[更新] 完成，开始更新番剧关联信息");
    updataRelations()
}, 60000);


function updataRelations() { // 获取关联番剧数据
    db.query(
        'SELECT bgmid FROM anime', // 获取 bangumi_data 表的所有 Bangumi ID
        function (error, result) {
            let bgmIdList = new Array(); // 全部 Bangumi ID 列表
            for (let i = 0; i < result.length; i++) {
                bgmIdList.push(result[i].bgmid);
            }
            for (let i = 0; i < bgmIdList.length; i++) {
                let thisBgmId = bgmIdList[i];
                getBgmRelations( // 调用 getBgmRelations 函数, 获取番组计划上的关联番剧数据
                    thisBgmId, // 传入 Bangumi ID
                    bgmIdList, // 传入 Bangumi ID List
                    (bgmRelations) => { // 回调函数
                        let thisBgmRelationsJSON = JSON.stringify(bgmRelations);
                        db.query(
                            'UPDATE bangumi_data SET relations_anime = ? WHERE bgmid = ?',
                            [thisBgmRelationsJSON, thisBgmId],
                            function (error, result) {
                                if (result.message.match('Rows matched: 1  Changed: 1')) {
                                    if (bgmRelations.length > 0) console.log(`抓取并更新了 bgm${thisBgmId} 的 ${bgmRelations.length} 条关联番剧数据`);
                                }
                                else{
                                    console.log(`UPDATE bgm${thisBgmId} 的关联番剧结果 ${result.message}`);
                                }
                            }
                        )

                    },
                    i * 50 // 传入延迟时间
                )
            }
        }
    )
}

function getBgmRelations(bgmId, bgmIdList, callback, executeTime) { // 获取 Bangumi 关联番剧的函数
    setTimeout(() => { // 异步延迟执行
        // console.log(`在 ${executeTime}ms 后执行了 bgm${bgmId} 的关联抓取`);
        if (bgmId == 0) { // 如果 Bangumi ID 是 000000 或者不存在，直接回复空数组
            callback([]);
            return
        }
        axios('https://bgm-api.5t5.top/v0/subjects/' + bgmId + '/subjects') // 调用 Bangumi API 获取关联番剧数据
            .then((result) => {
                let relationsData = result.data; // 原始数据
                let animeRelationsResults = new Array()
                for (let i = 0; i < relationsData.length; i++) { // 遍历每个关联作品
                    if (relationsData[i].type == 2) { // 找出来是动画的作品
                        for (let j = 0; j < bgmIdList.length; j++) { // 遍历 Bangumi ID List，找出来番剧库内有的作品
                            if (relationsData[i].id == bgmIdList[j]) { // 如果找到了
                                // console.log(`找到了 bgm${bgmId} 的关联库内相关番剧: bgm${relationsData[i].id}`);
                                animeRelationsResults.push(relationsData[i])
                                break
                            }
                        }
                    }
                }
                callback(animeRelationsResults) // 返回关联番剧数据





                // /*  因为 JavaScript 是异步的，所以说无法在主线程确定接下来的检查是否完成，
                //     因此创建一个数组存储每个关联番剧的检查任务，当检查完成时就把这个数组中的任务删除，
                //     最终当数组为空时，说明所有关联番剧都检查完成                                    */
                // let thisAnimeRelationsTask = relationsData // 任务数组，全部检查完成后为空
                // let thisAnimeRelationsResults = new Array() // 结果数组，存储既是动画又在番剧库内的相关番剧
                // for (let i = 0; i < thisAnimeRelationsTask.length; i++) { // 遍历任务数组，删除掉不是动画的相关作品
                //     if (thisAnimeRelationsTask[i].type != 2) { // 只存类型为动画的相关作品
                //         console.log(thisAnimeRelationsTask.length);
                //         thisAnimeRelationsTask.splice(i, 1); // 删除掉这个任务
                //         console.log(thisAnimeRelationsTask.length);
                //         continue
                //     }
                //     if (thisAnimeRelationsTask[i].type == 2) {
                //         db.query(
                //             'SELECT * FROM anime WHERE bgmid = ?',
                //             [thisAnimeRelationsTask[i].id],
                //             function (error, result) {
                //                 console.log(result);
                //                 if (result.length > 0) { // 如果在番剧库中
                //                     thisAnimeRelationsResults.push(thisAnimeRelationsTask[i]); // 存入结果数组
                //                     thisAnimeRelationsTask.splice(i, 1); // 删除这个任务
                //                 }
                //                 if (result.length == 0) { // 如果不在番剧库中
                //                     thisAnimeRelationsTask.splice(i, 1); // 删除这个任务
                //                 }
                //             }
                //         )
                //     }
                //     waitAllEnd()
                // }
                // function waitAllEnd() {
                //     if (thisAnimeRelationsTask.length == 0) { // 如果任务数组为空，说明所有任务都完成
                //         callback(thisAnimeRelationsResults); // 返回结果数组
                //     }
                //     else {
                //         console.log(`等待关联番剧检查完成... ${thisAnimeRelationsTask.length} 个任务还未完成`);
                //         setTimeout(waitAllEnd, 1000); // 如果任务数组不为空，继续等待
                //     }
                // }
            })
    }, executeTime);
}