export default function forbidden(res, message = 'Forbidden 没有相应权限') {
  // 传入 res, 直接回复 404
  if (!res) throw new Error('No res provide')
  res.status(403).send({ code: 403, message })
}