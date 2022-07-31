export default function wrongQuery(res) {
    if (!res) throw new Error('No res provide')
    res.send({ code: 400, message: '请求格式错误' })
    return
}