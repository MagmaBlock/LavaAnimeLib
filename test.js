const mysql = require('mysql');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var connection = mysql.createConnection(config);

let selectSql = `SELECT * FROM anime`
connection.query(selectSql, function (error, results) {
    if (error) throw error;
    console.log(results);
});