/*
    数据库连接模块
*/

import mysql from 'mysql';
import config from './config.js';

const db = mysql.createConnection(config.mysql);

function connect() {
    db.connect((err) => {
        if (err) {
            console.error('连接到数据库时出现错误: ', err);
            console.log('10 秒后尝试重新连接');
            setTimeout(() => { connect() }, 10000);
        } else {
            console.log('[启动信息] 数据库连接成功');
        }
    })
}
connect();

global.db = db;

export default db;