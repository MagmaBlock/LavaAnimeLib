import { dbQueryAsync } from "../tools/dbQuery.js";
import { createHash } from 'crypto';

export async function userRegister(req, res) { // 注册用户
    let bodyData = req.body;

    // 错误请求
    if (!bodyData.email || !bodyData.password || !bodyData.nick) {
        res.send({ code: 400, msg: 'bad request' });
        return;
    }

    // 查询数据库中是否有相同的邮箱
    let sameEmail = await dbQueryAsync(
        `SELECT * FROM user WHERE email = ?`,
        [bodyData.email]
    );
    if (sameEmail.length != 0) {
        res.send({ code: 400, message: '该邮箱已被注册' });
        return;
    }

    // 校验密码是否合法
    if (bodyData.password.match(/^(?=.*\d)(?=.*[a-z]).{7,18}$/) === null) {
        res.send({ code: 400, message: '密码不合法, 密码至少包含数字和字母, 且长度为7-18' });
        return
    }

    // 查询数据库中是否有相同的用户名，以及校验
    let sameNick = await dbQueryAsync(
        `SELECT * FROM user WHERE nick = ?`,
        [bodyData.nick]
    )
    if (sameNick.length != 0) {
        res.send({ code: 400, message: '昵称已存在，请更换一个' });
        return
    }
    if (bodyData.nick.length > 15 || bodyData.nick.length == 0) {
        res.send({ code: 400, message: '昵称长度应是 1-15 个字' });
        return
    }

    // 一切正常，插入数据库
    let sha256Password =
        'SHA256:' + createHash('sha256')
            .update(bodyData.password)
            .digest('hex');
    let registerResult = await dbQueryAsync(
        `INSERT INTO user (email, password, nick) VALUES (?, ?, ?)`,
        [bodyData.email, sha256Password, bodyData.nick]
    )
    if (registerResult.affectedRows != 0) {
        res.send({ code: 0, message: '注册成功' });
    }
    else {
        res.send({ code: 500, message: '服务器错误，注册失败' });
    }
}