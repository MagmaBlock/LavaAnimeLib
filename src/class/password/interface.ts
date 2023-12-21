export interface Password {
  salt: string;
  hashedPassword: string;

  /**
   * 获取此密码使用的盐
   */
  getSalt(): string;

  /**
   * 获取加密后的密码
   */
  getHashedPassword(): string;

  /**
   * 获取一个新的盐值
   */
  generateNewSalt(): string;

  /**
   * 对密码进行加盐
   * @param newSalt
   * @param truePassword
   */
  setSalt(newSalt: string, truePassword: string): void;

  /**
   * 对密码进行测试
   */
  testPassword(truePassword: string): boolean;

  /**
   * 序列化
   */
  stringify(): string;

  /**
   * 反序列化
   */
  parse(passwordStr: string): void;
}

export class PasswordParseFailedError extends Error {}
