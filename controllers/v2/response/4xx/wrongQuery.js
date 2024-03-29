/**
 * Bad Request 请求格式错误, 一般用于非法参数
 * @param {Express.Response} res
 * @param {String} message = Bad Request 请求格式错误
 */
export default function wrongQuery(res, message = "Bad Request 请求格式错误") {
  // 传入 res, 直接返回错误 400
  if (!res) throw new Error("No res provide");
  res.status(400);
  res.send({ code: 400, message });
}
