/**
 * 此接口描述了一种加密和解密资源的方法。
 * 本类仅描述对称式加密方法。
 */
export interface Encryption {
  /**
   * 提供资源，将签发一个 token
   * @param userId
   */
  sign(resource: any): string | null;

  /**
   * 验证一个 token，取得其对应的资源
   * @param token
   */
  verify(token: string): any | null;
}
