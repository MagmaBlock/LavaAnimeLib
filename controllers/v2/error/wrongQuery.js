export default function wrongQuery(res) {
    // 传入 res, 直接返回错误 400
    if (!res) throw new Error('No res provide')
    res.send({ code: 400, message: '请求格式错误' })
}