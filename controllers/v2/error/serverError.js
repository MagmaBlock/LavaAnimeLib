export default function serverError(res) {
    // 传入 res, 直接回复 500
    if (!res) throw new Error('No res provide')
    res.send({ code: 500, message: '服务器内部错误' })
}