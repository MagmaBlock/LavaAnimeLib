/**
 * 500 服务器内部错误
 * @param {Express.Response} res 
 * @param {String} message 
 */

export default function serverError(res, message = 'Internal Server Error 服务器内部错误') {
    // 传入 res, 直接回复 500
    if (!res) throw new Error('No res provide')
    res.status(500).send({ code: 500, message })
}