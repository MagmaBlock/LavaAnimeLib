import { UnauthorizedError } from "~/src/class/error/error";

export class TokenManager {
  /**
   * 更新 Token 有效期
   * @param token
   * @returns
   */
  static renewal(token: string) {
    let payload = useAuth.verify(token);

    // 如果 token 已过期
    if (payload === null) {
      throw new UnauthorizedError("会话续签失败");
    }

    // 续期的 token
    let newToken = useAuth.sign(payload);
    return newToken;
  }

  /**
   * 此方法判断用户的 Token 是否有效且能得到其是谁
   * @param token
   * @returns
   */
  static tokenVerify(token: string): TokenPayload | null {
    let payload = useAuth.verify(token);
    if (payload === null) return null;
    else {
      return <TokenPayload>payload;
    }
  }
}

export type TokenPayload = {
  id: number;
};
