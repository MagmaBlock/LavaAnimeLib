import { UnauthorizedError } from "../../class/error/error";

export function tokenRenewal(token: string) {
  let payload = useAuth.verify(token);

  // 如果 token 已过期
  if (payload === null) {
    throw new UnauthorizedError("会话续签失败");
  }

  // 续期的 token
  let newToken = useAuth.sign(payload);
  return newToken;
}
