/*
    数据库连接模块
*/

import mysql from 'mysql2';
import config from './config.js';

const db = mysql.createPool(config.mysql);

export default db;