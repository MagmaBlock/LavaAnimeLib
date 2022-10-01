export default function unauthorized(res, message = '凭证验证失败') {
  // 传入 res, 直接回复 401
  if (!res) throw new Error('No res provide')
  res.status(401).send({ code: 401, message })
}