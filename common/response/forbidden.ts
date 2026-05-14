/**
 * 403 Forbidden, 服务端理解请求, 但拒绝操作
 * 一般用于用户无权限等情况.
 * @param {Express.Response} res
 * @param {String} message
 */

export default function forbidden(res, message = "Forbidden 没有相应权限") {
  // 传入 res, 直接回复 403
  if (!res) throw new Error("No res provide");
  res.status(403).send({ code: 403, message });
}
