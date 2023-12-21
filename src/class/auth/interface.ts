export interface Auth {
  /**
   * 提供资源的标识，将签发一个 token
   * @param userId
   */
  sign(resource: any): string | null;

  /**
   * 验证一个 token，取得其对应的资源
   * @param token
   */
  verify(token: string): any | null;
}
