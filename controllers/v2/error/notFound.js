export default function notFound(res) {
    // 传入 res, 直接回复 404
    if (!res) throw new Error('No res provide')
    res.send({ code: 404, message: '找不到资源' })
}