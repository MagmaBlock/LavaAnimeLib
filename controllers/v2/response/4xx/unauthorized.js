/**
 * 401 Unauthorized 身份验证失败, 用户未登录 / 凭据异常
 * 前端会直接将此错误显示未登录!
 * @param {Express.Response} res 
 * @param {String} message 
 */

export default function unauthorized(res, message = 'Unauthorized 身份验证失败') {
  // 传入 res, 直接回复 401
  if (!res) throw new Error('No res provide')
  res.status(401).send({ code: 401, message })
}