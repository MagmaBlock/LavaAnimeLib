import { findUserByID } from "../../controllers/v2/user/findUser.js";
import { useToken } from "../../controllers/v2/user/token.js";

export async function handleAuth(req, res, next) {
  // 尝试验证登录
  let authHeader = req.get("Authorization");
  if (authHeader) {
    let userID = await useToken(authHeader);
    if (userID) {
      req.user = await findUserByID(userID);
      /*
        req.user = {
            id: Number, email: String,
            name: String, password: String,
            create_time: Date,
            data: Object || null,
            settings: Object || null ,
            expirationTime: Date (如果是从缓存中读取，此项存在)
        }
      */
    }
  }

  next();
}
