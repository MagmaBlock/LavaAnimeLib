import config from "../../../common/config.js";
import { promiseDB } from "../../../common/sql.js";
import { testPassword } from './password.js';
import { createToken, saveToken } from "./token.js";

const maxTry = config.security.loginMaxTry
const waitTime = config.security.banWaitTime

const tokenExpirationTime = config.security.tokenExpirationTime

// 密码错误计数器
let countStore = {
    ip: {},
    user: {}
};

function errorPasswordCounter(key, type) {
    if (countStore[type][key]) { // 如果已经错过一次以上
        if (countStore[type][key].count >= maxTry - 1) { // 如果错误次数超限，上锁
            countStore[type][key].lock = true
            setTimeout(() => {
                delete countStore[type][key]
            }, 1000 * 60 * waitTime); // x 分钟后再试吧
        } else { // 如果错的还不够多
            countStore[type][key].count++
        }
    } else { // 如果第一次出错
        countStore[type][key] = {
            count: 1,
            lock: false
        }
    }
}

export async function userLoginAPI(req, res) {
    let { account, password } = req.body
    // account 可以是邮箱、用户名 

    // 错误请求
    if (!account || !password) {
        return res.send({ code: 400, msg: '缺失参数' });
    }

    // 找用户
    let user = await findUser(account)
    if (!user) {
        return res.send({ code: 404, message: '用户不存在' })
    }

    // 检查此请求是否错误次数过多
    if (countStore.ip[req.ip]?.lock) {
        return res.send({ code: 403, message: '请求错误次数过多' })
    }
    if (countStore.user[user.id]?.lock) {
        return res.send({ code: 403, message: '请求错误次数过多' })
    }

    // 检查密码
    let testPWResult = testPassword(password, user.password)
    if (testPWResult) { // 密码正确
        // 创建 Token，保存
        let token = createToken()
        let expirationTime = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * tokenExpirationTime)
        await saveToken(token, user.id, expirationTime)
        // 并以 Cookie 发送
        res.cookie('token', token, {
            httpOnly: true, expires: expirationTime
        })
        res.send({ code: 200, message: `登录成功, 欢迎回来, ${user.name}` })
    } else { // 错误
        res.send({ code: 403, message: '密码错误' })
        errorPasswordCounter(user.id, 'user')
        errorPasswordCounter(req.ip, 'ip')
    }


}


// 使用邮箱、用户名来找到可能的用户
async function findUser(account) {
    let resultByEmail = await promiseDB.query(
        'SELECT * FROM user WHERE email = ?',
        [account]
    )
    if (resultByEmail[0].length) {
        return resultByEmail[0][0]
    }
    let resultByName = await promiseDB.query(
        'SELECT * FROM user WHERE name = ?',
        [account]
    )
    if (resultByName[0].length) {
        return resultByName[0][0]
    }
    return false
}