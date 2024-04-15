import { createHash } from "crypto";
import { EncryptedPassword, PasswordParseFailedError } from "./interface";

/**
 * Sha256 密码实现
 */
export class Sha256Password implements EncryptedPassword {
  salt: string;
  hashedPassword: string;

  constructor(salt?: string, hashedPassword?: string) {
    this.salt = salt;
    this.hashedPassword = hashedPassword;
  }

  getSalt(): string {
    return this.salt;
  }

  getHashedPassword(): string {
    return this.hashedPassword;
  }

  /**
   * @returns length 16
   */
  generateNewSalt(): string {
    let ts = new Date().getTime();
    let random = Math.random();
    let salt = (ts * random).toString();
    let sha1 = createHash("sha1").update(salt).digest("hex");
    return sha1.slice(0, 16);
  }

  setSalt(newSalt: string, truePassword: string): void {
    this.salt = newSalt;
    this.hashedPassword = createHash("sha256")
      .update(truePassword + newSalt)
      .digest("hex");
  }

  testPassword(truePassword: string): boolean {
    const hashedPassword = createHash("sha256")
      .update(truePassword + this.salt)
      .digest("hex");
    return this.hashedPassword === hashedPassword;
  }

  stringify(): string {
    return `${this.salt}:${this.hashedPassword}`;
  }

  parse(passwordStr: string): void {
    const arr = passwordStr.split(":");
    if (arr.length !== 2) throw new PasswordParseFailedError();
    this.salt = arr[0];
    this.hashedPassword = arr[1];
  }
}
