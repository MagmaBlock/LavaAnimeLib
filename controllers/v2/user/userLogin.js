import config from "../../../common/config.js";
import success from "../response/2xx/success.js";
import forbidden from "../response/4xx/forbidden.js";
import notFound from "../response/4xx/notFound.js";
import wrongQuery from "../response/4xx/wrongQuery.js";
import { findUser } from "./findUser.js";
import { testPassword } from './password/password.js';
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
        return wrongQuery(res, '缺失参数')
    }

    // 找用户
    let user = await findUser(account)
    if (!user) {
        return notFound(res, '用户不存在')
    }

    // 检查此请求是否错误次数过多
    if (countStore.ip[req.ip]?.lock || countStore.user[user.id]?.lock) {
        return forbidden(res, '请求错误次数过多, 请等一段时间再试')
    }

    // 检查密码
    let testPWResult = testPassword(password, user.password)
    if (testPWResult) { // 密码正确
        // 创建 Token，保存
        let token = createToken()
        let expirationTime = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * tokenExpirationTime)
        await saveToken(token, user.id, expirationTime)
        success(res,
            { // response body
                token: {
                    value: token,
                    expirationTime: expirationTime
                },
                user: {
                    ...user,
                    password: undefined,
                }
            },
            `登录成功, 欢迎回来, ${user.name}`
        )
    } else { // 错误
        wrongQuery(res, '密码错误')
        errorPasswordCounter(user.id, 'user')
        errorPasswordCounter(req.ip, 'ip')
    }
}