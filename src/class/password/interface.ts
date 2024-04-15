import { Encryption } from "@prisma/client";
import { Sha256Password } from "./sha256";
import { InternalServerError } from "../error/error";

/**
 * 本接口描述了一种被非对称加密算法加密的密码
 */
export interface EncryptedPassword {
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

/**
 * 一个工厂函数，根据传入的加密算法类型，返回对应的加密密码实例。
 */
export function encryptedPasswordFactory(
  encryption: Encryption
): EncryptedPassword {
  if (encryption === "Sha256") {
    return new Sha256Password();
  }

  throw new InternalServerError("Encryption 不支持");
}
