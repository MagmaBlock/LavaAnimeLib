import { count, sql } from "drizzle-orm";
import { db } from "../../common/database/connection.js";
import { user } from "../../common/database/schema/user.js";
import { log } from "../../common/tools/logger.js";
import { getFormattedPassword } from "../../services/v2/user/password.js";

const DEFAULT_ADMIN_EMAIL = "admin@lavaanime.local";
const DEFAULT_ADMIN_NAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "adminadmin";

export interface BootstrapResult {
  bootstrapped: boolean;
  email: string;
  name: string;
}

export async function bootstrapFirstAdmin(): Promise<BootstrapResult> {
  const [row] = await db.select({ c: count() }).from(user);
  const total = Number(row?.c ?? 0);
  if (total > 0) {
    return { bootstrapped: false, email: "", name: "" };
  }

  const passwordHash = getFormattedPassword(DEFAULT_ADMIN_PASSWORD);
  const adminData = JSON.stringify({ permission: { admin: true } });
  await db.execute(
    sql`INSERT INTO \`user\` (email, name, password, data) VALUES (${DEFAULT_ADMIN_EMAIL}, ${DEFAULT_ADMIN_NAME}, ${passwordHash}, ${adminData})`
  );

  log.warn(
    { email: DEFAULT_ADMIN_EMAIL, name: DEFAULT_ADMIN_NAME },
    `首次启动：已创建默认管理员 | 账号: ${DEFAULT_ADMIN_EMAIL} | 密码: ${DEFAULT_ADMIN_PASSWORD} | 请登录后立即修改密码！`
  );

  return { bootstrapped: true, email: DEFAULT_ADMIN_EMAIL, name: DEFAULT_ADMIN_NAME };
}

export default bootstrapFirstAdmin;