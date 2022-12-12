import { promiseDB } from "../../../common/sql.js";
import serverError from "../error/serverError.js";
import { testInviteCode, useInviteCode } from "./inviteCode.js";
import { getFormattedPassword } from "./password.js";

const regExpDict = {
    email: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
    password: /^(?=.*[a-zA-Z]).{7,18}$/
}

export async function userRegisterAPI(req, res) { // 注册用户
    let { email, password, name, inviteCode } = req.body

    try {
        // 错误请求
        if (!email || !password || !name || !inviteCode) {
            return res.send({ code: 400, msg: '请求语法错误' });
        }

        /// 邮箱
        // 校验邮箱
        if (!regExpDict.email.test(email)) {
            return res.send({ code: 400, message: '邮箱不合法' })
        }
        // 查询数据库中是否有相同的邮箱
        let sameEmail = await promiseDB.query(
            `SELECT * FROM user WHERE email = ?`,
            [email]
        );
        if (sameEmail[0].length != 0) {
            return res.send({ code: 400, message: '该邮箱已被注册' });
        }

        /// 密码
        // 校验密码是否合法
        if (!regExpDict.password.test(password)) {
            return res.send({ code: 400, message: '密码不合法, 密码至少包含字母, 且长度为7-18' });
        }

        /// 昵称
        // 查询数据库中是否有相同的用户名，以及校验
        let sameName = await promiseDB.query(
            `SELECT * FROM user WHERE \`name\` = ?`,
            [name]
        )
        if (sameName[0].length != 0) {
            return res.send({ code: 400, message: '昵称已存在，请更换一个' });
        }
        if (name.length > 30 || name.length == 0) {
            return res.send({ code: 400, message: '昵称长度太长或为空' });
        }

        /// 邀请码
        let inviteCodeStatus = await testInviteCode(inviteCode)
        if (inviteCodeStatus.real && !inviteCodeStatus.used && !inviteCodeStatus.expired) {
            let nextUserID = await getNextUserID()
            await useInviteCode(inviteCode, nextUserID)
        } else {
            return res.send({ code: 400, message: '邀请码不可用' })
        }

        // 一切正常，插入数据库
        let saltyPassword = getFormattedPassword(password)
        let registerResult = await promiseDB.query(
            `INSERT INTO user (email, password, \`name\`) VALUES (?, ?, ?)`,
            [email, saltyPassword, name]
        )
        if (registerResult.affectedRows != 0) {
            res.send({ code: 200, message: '注册成功' });
        }
        else {
            res.send({ code: 500, message: '服务器错误，注册失败' });
        }

    } catch (error) {
        console.error(error)
        return serverError(res)
    }
}


// 获取下一个用户的 ID
export async function getNextUserID() {
    let queryResult = await promiseDB.query(
        `SELECT AUTO_INCREMENT FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = 'user'`
    )
    return queryResult[0][0].AUTO_INCREMENT
}