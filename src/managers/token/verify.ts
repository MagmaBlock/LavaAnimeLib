/**
 * 此方法判断用户的 Token 是否有效且能得到其是谁
 * @param token
 * @returns
 */
export function tokenVerify(token: string): TokenPayload | null {
  let payload = useAuth.verify(token);
  if (payload === null) return null;
  else {
    return <TokenPayload>payload;
  }
}
