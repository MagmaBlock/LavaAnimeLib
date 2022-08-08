export default function wrongQuery(res, message = '请求格式错误') {
    // 传入 res, 直接返回错误 400
    if (!res) throw new Error('No res provide')
    res.status(400).send({ code: 400, message })
}