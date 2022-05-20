/* 此脚本用于执行文件夹目录索引的定期同步，从Alist保存至MySQl，然后完成一些番剧信息的刷新 */

import axios from 'axios';

import db from '../common/sql.js'; // 数据库连接模块
import config from '../common/config.js';

import { getPathAsync } from '../controllers/tools/alistGetPath.js';
import { dbQueryAsync } from '../controllers/tools/dbQuery.js';

function getIndexByDir(path) { // 异步获取文件夹列表并返回
    return new Promise(async (resolve, reject) => {
        let dirs = await getPathAsync(path); // 获取文件夹列表
        for (let i = 0; i < dirs.length; i++) { // 遍历，删除不是文件夹的信息
            if (dirs[i].type !== 1) {
                console.log(`忽略非文件夹信息: ${dirs[i].name}`);
                dirs.splice(i, 1); // 删除不是文件夹的信息
            }
        }
        resolve(dirs); // 返回文件夹列表
    })
}

doEverything()
async function doEverything() {
    await updateIndex(); // 从 Alist 刷新索引，比较耗时
    await cutBgmId(); // 分割番剧名和ID  一瞬间
    await insertBgmId(); // 把 anime 表的 bgmId 同步到 bangumi_data 表
    await updateBgmSubjectsData(); // 升级 bangumi_data 表的 Subjects 数据，同时顺便更新 anime 表的 Poster，也很耗时
    await updataRelations(); // 刷新获取关联番剧的数据
    console.log("[同步] 全部完成, 将于 20 秒后关闭");
    await Delay(20000);
    db.end();
}

function updateIndex() { // 更新索引

    return new Promise(async (resolve, reject) => {

        // 获取年份列表
        let yearIndex = await getIndexByDir('/');
        console.log(`[同步] 年份列表获取成功，共 ${yearIndex.length} 个年份`);

        // 遍历年份列表，获取每年的分类列表
        for (let i = 0; i < yearIndex.length; i++) { // 循环遍历

            let thisYear = yearIndex[i].name; // 这年的名称

            // 同步获取每年的分类列表
            let thisYearTypeIndex = await getIndexByDir('/' + thisYear);
            console.log(`[同步] ${thisYear} 分类列表获取成功，共 ${thisYearTypeIndex.length} 个分类`);

            // 遍历每年的分类列表，获取每个分类的番剧列表
            for (let j = 0; j < thisYearTypeIndex.length; j++) {

                let thisType = thisYearTypeIndex[j].name; // 这个分类的名称

                // 同步获取每个分类的番剧列表
                let thisTypeAnime = await getIndexByDir(`/${thisYear}/${thisType}`);
                // console.log(`[同步] ${thisYear}/${thisType} 番剧列表获取成功，共 ${thisTypeAnime.length} 个番剧`);

                // 同步获取数据库中的相应番剧列表
                let dbResult = await dbQueryAsync(
                    'SELECT * FROM anime WHERE year=? AND type=?',
                    [thisYear, thisType] // 占位符写法
                )

                // 从 Alist 方向比较 Alist 和 数据库内的番剧列表，找到新的番剧
                for (let k = 0; k < thisTypeAnime.length; k++) { // 父遍历 Alist

                    let thisAlistAnime = thisTypeAnime[k];
                    let thisAnimeInDB = false; // 如果为true，则说明数据库中有这个番剧

                    for (let l = 0; l < dbResult.length; l++) { // 子遍历 数据库

                        let thisDBAnime = dbResult[l];

                        if (thisAlistAnime.name == thisDBAnime.name && thisDBAnime.deleted == 0) { // 如果库内已有
                            thisAnimeInDB = true; //  标记已有
                            break; // 跳出子遍历
                        }

                        else if (thisAlistAnime.name == thisDBAnime.name && thisDBAnime.deleted == 1) { // 如果库内已有，但是已被删除
                            console.log(`[同步][恢复] ${thisAlistAnime.name} 被删除后重新出现，将被恢复`);
                            // console.log(thisAlistAnime);
                            thisAnimeInDB = true;
                            db.query(`UPDATE anime SET deleted=0 WHERE id=?`, [thisDBAnime.id]);
                        }

                    }

                    if (!thisAnimeInDB) { // 遍历完了，如果数据库中没有这个番剧，则插入

                        db.query(
                            'INSERT INTO anime (\`year\`, \`type\`, name) VALUES (?, ?, ?)',
                            [thisYear, thisType, thisAlistAnime.name], // 占位符写法
                            function (error, result) {
                                if (error) {
                                    console.error(error);
                                }
                                console.log(`[同步][新番剧] ${thisAlistAnime.name} 已插入数据库`);
                            }
                        )
                    }

                }

                // 从 数据库内方向比较 数据库内的番剧列表 和 Alist 内的番剧列表，找到已删除的番剧
                for (let k = 0; k < dbResult.length; k++) { // 父遍历 数据库

                    let thisDBAnime = dbResult[k]; // 这个番剧的数据库信息
                    let thisAnimeInAlist = false; // 如果为true，则说明Alist中有这个番剧

                    for (let l = 0; l < thisTypeAnime.length; l++) { // 子遍历 Alist

                        let thisAlistAnime = thisTypeAnime[l]; // 这个Alist的番剧文件夹信息

                        if (thisDBAnime.name == thisAlistAnime.name && thisDBAnime.deleted == 0) { // 数据库中有，Alist中也有
                            thisAnimeInAlist = true;
                            break; // 跳出子遍历
                        }

                        if (thisDBAnime.deleted == 1) { // 如果数据库中已被标记删除 
                            thisAnimeInAlist = true; // 标记已有，虽然并没有
                            break; // 直接跳过当前番剧
                        }

                    }

                    if (!thisAnimeInAlist) { // 遍历完了，如果数据库中有，但是Alist中没有，则删除

                        db.query(
                            'UPDATE anime SET deleted=1 WHERE name=?',
                            [thisDBAnime.name], // 占位符写法
                            function (error, result) {
                                if (error) {
                                    console.error(error);
                                }
                                console.log(`[同步][遗失番剧] ${thisDBAnime.name} 仅在数据库中有记录，标记为删除`);
                            }
                        )
                    }
                }

                // console.log(`[同步] ${thisYear}/${thisType} 数据库中已有 ${dbResult.length} 个番剧`);
            }
        }
        console.log(`[同步] 同步完成`);
        resolve('success');
    })

}

function cutBgmId() {

    return new Promise(async (resolve, reject) => {

        let noBgmIdList = await dbQueryAsync(
            'SELECT * FROM anime WHERE bgmid is null and deleted = 0'
        );

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
                    console.log(`[分割] 成功分割番剧名: ${thisAnimeTitle} - ${thisAnimeBgmId}`);
                }
            )
        }

        console.log("[分割] 已发射全部异步线程写入数据库");
        resolve('success');

    })

}


function insertBgmId() { // 从 anime 表读取数据，向 bangumi_data 表插入新的 Bangumi ID。

    return new Promise(async (resolve, reject) => {

        let allBgmIdInAnimeTable = await dbQueryAsync('SELECT bgmid FROM anime WHERE deleted = 0');
        let allBgmIdInAnime = new Array(); // anime 表所有的 Bangumi ID
        for (let i = 0; i < allBgmIdInAnimeTable.length; i++) {
            allBgmIdInAnime.push(parseInt(allBgmIdInAnimeTable[i].bgmid));
        }

        let allBgmIdInBangumiDataTable = await dbQueryAsync('SELECT bgmid FROM bangumi_data');
        let allBgmIdInBangumiData = new Array(); // bangumi_data 表所有的 Bangumi ID
        for (let i = 0; i < allBgmIdInBangumiDataTable.length; i++) {
            allBgmIdInBangumiData.push(parseInt(allBgmIdInBangumiDataTable[i].bgmid));
        }

        // console.log(allBgmIdInAnime, allBgmIdInBangumiData);

        let newBgmId = new Array(); // bangumi_data 表缺少的 Bangumi ID
        allBgmIdInAnime.forEach((bgmId) => {
            if (!allBgmIdInBangumiData.includes(bgmId)) {
                newBgmId.push(bgmId);
            }
        })
        if (newBgmId.length > 0) { // 如果有新的 Bangumi ID，则插入数据库
            console.log(`[Bangumi Data] bangumi_data 表缺少数据 ${JSON.stringify(newBgmId)}`);
            newBgmId.forEach((bgmId) => {
                db.query(
                    'INSERT INTO bangumi_data (bgmid) VALUES (?)',
                    [bgmId],
                    function (error, result) {
                        console.log(`[Bangumi Data] 已新建 bgm${bgmId}`);
                    }
                )
            })
            resolve('success');
        }
        if (newBgmId.length == 0) {
            console.log(`[Bangumi Data] bangumi_data 不需要更新.`);
            resolve('lastest');
        }

    })

}


function updateBgmSubjectsData() { // 升级 bangumi_data 表的 Bangumi 主题数据，同时顺便更新 Poster

    return new Promise(async (resolve, reject) => {

        let bgmIdListDB = await dbQueryAsync(
            'SELECT bgmid FROM bangumi_data'
        )
        let bgmIdList = new Array();
        bgmIdListDB.forEach(bgmId => {
            bgmIdList.push(bgmId.bgmid);
        })

        for (let i = 0; i < bgmIdList.length; i++) {
            let bgmId = bgmIdList[i];
            if (bgmId == 0) continue;
            (async () => {
                let subjectData = await axios.get(config.bangumi.host + '/v0/subjects/' + bgmId);
                if (subjectData.data.images.large) {
                    let posterUrl = subjectData.data.images.large;
                    posterUrl = posterUrl.replace('lain.bgm.tv', 'anime-img.5t5.top') + '/poster'
                    db.query(
                        'UPDATE anime SET poster = ? WHERE bgmid = ?',
                        [posterUrl, bgmId],
                        function (error, result) {
                            console.log(`[Bangumi Data] 更新番剧 bgm${bgmId} ${subjectData.data.name} 的海报`);
                        }
                    )
                }
                db.query(
                    `UPDATE bangumi_data SET subjects = ? WHERE bgmid = ?`,
                    [JSON.stringify(subjectData.data), bgmId]
                )
            })();
            await Delay(100);
        }

        resolve('success');

    })

}



function updataRelations() { // 获取关联番剧数据

    return new Promise(async (resolve, reject) => {

        // 取 BgmId 列表
        let bgmIdListDB = await dbQueryAsync('SELECT bgmid FROM bangumi_data');
        let bgmIdList = new Array();
        bgmIdListDB.forEach(bgmId => { bgmIdList.push(bgmId.bgmid) }); // bangumi_data 表的 BgmId 列表

        // 取所有库内已有番剧 BgmID 用于下面的筛选
        let allBgmIdInAnimeTable = await dbQueryAsync('SELECT bgmid FROM anime WHERE deleted = 0');
        let allBgmIdInAnime = new Array();
        allBgmIdInAnimeTable.forEach(bgmId => { allBgmIdInAnime.push(parseInt(bgmId.bgmid)) }); // anime 表的 BgmID 列表

        for (let i = 0; i < bgmIdList.length; i++) { // 获取每个 data 表里的关联番剧

            let bgmId = bgmIdList[i];
            if (bgmId == 0) continue;

            (async () => { // 发出一个异步线程
                let subjectRelationsData = await axios.get(config.bangumi.host + '/v0/subjects/' + bgmId + '/subjects') // 从 BGM API 抓
                let subjectRelations = new Array();
                subjectRelationsData.data.forEach(subject => {
                    // 如果这个番剧在 anime 表里，且是动画，则添加进关联番剧列表
                    if (allBgmIdInAnime.includes(subject.id) && subject.type == 2) {
                        console.log(`[Bangumi Data] bgm${bgmId} <== ${subject.id}(${subject.name})`);
                        subjectRelations.push(subject);
                    }
                })
                db.query(
                    `UPDATE bangumi_data SET relations_anime = ? WHERE bgmid = ?`,
                    [JSON.stringify(subjectRelations), bgmId]
                )
                console.log(`[Bangumi Data] 更新番剧 bgm${bgmId} 的关联番剧，找到 ${subjectRelations.length} 个`);
            })();
            await Delay(100);
        }

        resolve('success');

    })

}

function Delay(ms = 1000) { // 延迟函数，默认延迟 1000 毫秒
    return new Promise(resolve => setTimeout(resolve, ms));
}