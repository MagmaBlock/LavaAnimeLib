export function tokenRenewal(token: string) {
  let payload = useAuth.verify(token);

  // 如果 token 已过期
  if (payload === null) return null;

  // 续期的 token
  let newToken = useAuth.sign(payload);
  return newToken;
}
