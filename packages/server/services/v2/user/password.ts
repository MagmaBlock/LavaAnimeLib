import { createHash } from "crypto";

export function testPassword(password: string, saltyPassword: string): boolean {
  const saltyPasswordGroup = saltyPassword.split(":");
  if (saltyPasswordGroup[0] === "sha256") {
    const test = createHash("sha256")
      .update(password + saltyPasswordGroup[1])
      .digest("hex");
    if (test === saltyPasswordGroup[2]) {
      return true;
    }
  }
  return false;
}

export function isSecurePassword(password: string): boolean {
  return /^(?=.*[a-zA-Z]).{7,64}$/.test(password);
}

export function getFormattedPassword(password: string): string {
  const salt = generateSalt();
  return `sha256:${salt}:` + createHash("sha256").update(password + salt).digest("hex");
}

function generateSalt(): string {
  const ts = new Date().getTime();
  const random = Math.random();
  const salt = (ts * random).toString();
  const sha1 = createHash("sha1").update(salt).digest("hex");
  return sha1.slice(0, 16);
}
