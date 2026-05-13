import cache from "../../../../common/cache.js";
import { promiseDB } from "../../../../common/sql.js";
import success from "../../response/2xx/success.js";
import wrongQuery from "../../response/4xx/wrongQuery.js";
import serverError from "../../response/5xx/serverError.js";

export async function updateNameAPI(req, res) {
  let { name } = req.body;
  let user = req.user;

  // 校验
  if (typeof name != "string")
    return wrongQuery(res, "请求格式错误: 用户名不是 String");
  if (!name) return wrongQuery(res, "用户名不可为空");
  if (name.length > 30) {
    return wrongQuery(res, "用户名长度太长");
  }
  if (user.name == name) {
    return wrongQuery(res, "更改的用户名不能和之前的相同");
  }

  // 查询数据库中是否有相同的用户名
  try {
    let sameName = await promiseDB.query(
      `SELECT * FROM user WHERE \`name\` = ?`,
      [name]
    );
    if (sameName[0].length) {
      return wrongQuery(res, "昵称已存在，请更换一个");
    }
  } catch (error) {
    console.error(error);
    return serverError(res);
  }

  // 进行用户名更改
  try {
    await promiseDB.query("UPDATE `user` SET name=? WHERE id=?", [
      name,
      user.id,
    ]);
    success(res, null, "更改成功");
    delete cache.user[user.id];
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
