const axios = require('axios');
const mysql = require('mysql');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var connection = mysql.createConnection(config);

const shareId = 'jqMFl';

axios.get(`https://dav.5t5.top/api/v3/share/list/${shareId}/`).then(ret => { // 获取年代列表
    var yearList = ret.data.data.objects;
    for (let y = 0; y < yearList.length; y++) { // 遍历每一年
        let thisPath = encodeURIComponent(yearList[y].name); // 这一年的路径
        axios.get(`https://dav.5t5.top/api/v3/share/list/${shareId}/${thisPath}`) // 获取这一年的所有季度
            .then(ret => {
                var seasonList = ret.data.data.objects;
                for (let s = 0; s < seasonList.length; s++) { // 遍历每一季度
                    let thisPath = encodeURIComponent(yearList[y].name + '/' + seasonList[s].name); // 这一季度的路径
                    axios.get(`https://dav.5t5.top/api/v3/share/list/${shareId}/${thisPath}`) // 获取这一季度的所有番组
                        .then((ret) => {





                            let objects = ret.data.data.objects;
                            for (let i = 0; i < objects.length; i++) { // 遍历数据
                                // 生成部分 API 未提供的数据
                                objects[i].year = objects[i].path.split('/')[1];
                                objects[i].month = objects[i].path.split('/')[2];
                                objects[i].bgmid = objects[i].name.match("\\d+$")[0];
                                objects[i].name = objects[i].name.replace('\'', '\\\'');
                                objects[i].title = objects[i].name.replace(objects[i].bgmid, '');
                                objects[i].title = objects[i].title.slice(0, objects[i].title.length - 1)

                                // 查询数据库中是否存在该 ID 的数据
                                selectSql = `SELECT * FROM anime WHERE id = '${objects[i].id}'`
                                // 执行查询
                                connection.query(selectSql, function (error, results) {
                                    if (error) throw error;
                                    // 如果查询结果为空，则插入数据
                                    if (results.length == 0) {
                                        insertSql = `INSERT INTO anime (id, bgmid, name, year, month, views, title) VALUES ('${objects[i].id}', '${objects[i].bgmid}', '${objects[i].name}', '${objects[i].year}', '${objects[i].month}', 0, ${objects[i].title})`
                                        connection.query(insertSql, function (error, results) {
                                            if (error) throw error;
                                            console.log(`未发现 ${objects[i].id} 对应的记录，全新插入了一条相关记录: `, results);
                                        });
                                    }
                                    // 如果查询结果不为空，则更新数据
                                    if (results.length !== 0) {
                                        // if (objects[i].name.match(/\[NSFW\]/g)){
                                        //     console.log(`${objects[i].id} 对应的记录为 NSFW 番组，增加标签。`);
                                        //     updateSql = `UPDATE anime SET nsfw = '1' WHERE id = '${objects[i].id}'`
                                        //     connection.query(updateSql, function (error, results) {
                                        //         if (error) throw error;
                                        //         console.log(results);
                                        //     });
                                        // }
                                        updateSql = `UPDATE anime SET bgmid = '${objects[i].bgmid}', name = '${objects[i].name}', year = '${objects[i].year}', month = '${objects[i].month}', title = '${objects[i].title}' WHERE id = '${objects[i].id}'`
                                        connection.query(updateSql, function (error, results) {
                                            if (error) throw error;
                                            console.log(`更新了 ${objects[i].id} 对应的记录: `, results);
                                        });
                                    }
                                });
                            }











                        })
                        .catch((err) => {
                            console.error(err);
                        });

                }
            })
            .catch((err) => {
                console.error(err);
            });
    }
    setTimeout(() => {
        connection.end(); // 关闭数据库连接
    }, 3000);
})