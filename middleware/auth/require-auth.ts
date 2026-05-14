import forbidden from "../../common/response/forbidden.js";
import unauthorized from "../../common/response/unauthorized.js";

// 如果请求未携带 req.user.id 将会回复 401
export function requireLogin(req, res, next) {
  if (req.user?.id) {
    next();
  } else {
    return unauthorized(res);
  }
}

// 如果请求的 req.user.data.permission.admin 为假或不存在将会回复 403
export function requireAdmin(req, res, next) {
  if (req.user.data?.permission?.admin) {
    next();
  } else {
    return forbidden(res, "没有管理员权限");
  }
}
