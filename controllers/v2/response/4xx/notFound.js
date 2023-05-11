/**
 * 404 Not Found
 * @param {Express.Response} res
 * @param {String} message
 */

export default function notFound(res, message = "Not Found 找不到资源") {
  // 传入 res, 直接回复 404
  if (!res) throw new Error("No res provide");
  res.status(404).send({ code: 404, message });
}
