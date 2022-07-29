import { dbQueryAsync } from "../../v1/tools/dbQuery.js";
import { createHash } from 'crypto';

let errorPasswordCounter = new Object(); // 密码错误计数器

export async function userLogin(req, res) {
    let bodyData = req.body;
    if (!bodyData.email || !bodyData.password) { // 错误请求
        res.send({ code: 400, msg: 'bad request' });
        return
    }

    // 查询此邮箱是否已经注册
    let thisEmailUser = await dbQueryAsync(
        'SELECT * FROM user WHERE email = ?',
        [bodyData.email]
    )
    if (thisEmailUser.length == 0) {
        res.send({ code: 400, msg: '此邮箱并未注册' });
        return
    }
    thisEmailUser = thisEmailUser[0];

    // 开始校验密码
    // 若数据库中的值使用的是 SHA256
    if (thisEmailUser.password.startsWith('SHA256:')) {
        let sha256Password = // 前端提交的密码
            'SHA256:' + createHash('sha256')
                .update(bodyData.password)
                .digest('hex');

        // 登录锁判断逻辑
        if (errorPasswordCounter[bodyData.email] >= 10 || errorPasswordCounter[bodyData.email] == -1) {
            res.send({ code: 400, msg: '密码错误次数过多，请稍后再试' });
            if (errorPasswordCounter[bodyData.email] >= 10) { // 如果超过10次，将账号内存锁定，并且在半小时后解锁
                console.log(`[错误密码] 用户 ${thisEmailUser.nick}(${bodyData.email}) 密码错误 ${errorPasswordCounter[bodyData.email]} 次，已加锁，半小时或重启后回复`);
                errorPasswordCounter[bodyData.email] = -1; // -1 意为锁定
                setTimeout(() => { delete errorPasswordCounter[bodyData.email] }, 1800000)
                return
            }
            if (errorPasswordCounter[bodyData.email] == -1) {
                console.log(`[错误密码] 用户 ${thisEmailUser.nick}(${bodyData.email}) 密码锁定后尝试登录`);
                return
            }
        }
        if (sha256Password != thisEmailUser.password) {
            res.send({ code: 400, msg: '密码错误' });
            errorPasswordCounter[bodyData.email] = (errorPasswordCounter[bodyData.email] || 0) + 1;
            console.log(`[错误密码] 用户 ${thisEmailUser.nick}(${bodyData.email}) 密码错误 ${errorPasswordCounter[bodyData.email]} 次`);
            return
        }
        if (sha256Password == thisEmailUser.password) {
            res.send({ code: 200, msg: '登录成功' });
        }
    }
}