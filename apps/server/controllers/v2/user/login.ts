import type { Request, Response } from "express";
import config from "../../../common/config.js";
import success from "../../../common/response/success.js";
import forbidden from "../../../common/response/forbidden.js";
import notFound from "../../../common/response/not-found.js";
import badRequest from "../../../common/response/bad-request.js";
import { findUser } from "../../../services/v2/user/user.js";
import { testPassword } from "../../../services/v2/user/password.js";
import { createToken, saveToken } from "../../../services/v2/user/token.js";

const maxTry = config.security.loginMaxTry;
const waitTime = config.security.banWaitTime;
const tokenExpirationTime = config.security.tokenExpirationTime;

interface CountEntry {
  count: number;
  lock: boolean;
}

const countStore: {
  ip: Record<string, CountEntry>;
  user: Record<string, CountEntry>;
} = {
  ip: {},
  user: {},
};

function errorPasswordCounter(key: string, type: "ip" | "user") {
  if (countStore[type][key]) {
    if (countStore[type][key].count >= maxTry - 1) {
      countStore[type][key].lock = true;
      setTimeout(() => {
        delete countStore[type][key];
      }, 1000 * 60 * waitTime);
    } else {
      countStore[type][key].count++;
    }
  } else {
    countStore[type][key] = {
      count: 1,
      lock: false,
    };
  }
}

export async function userLogin(req: Request, res: Response): Promise<void> {
  const { account, password } = req.body;

  if (!account || !password) {
    return badRequest(res, "缺失参数");
  }

  const user = await findUser(account);
  if (!user) {
    return notFound(res, "用户不存在");
  }

  if (countStore.ip[req.ip ?? ""]?.lock || countStore.user[user.id]?.lock) {
    return forbidden(res, "请求错误次数过多, 请等一段时间再试");
  }

    const testPWResult = testPassword(password as string, user.password);
  if (testPWResult) {
    const token = createToken();
    const expirationTime = new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * tokenExpirationTime
    );
    await saveToken(token, user.id, expirationTime);
    const { password: _, ...safeUser } = user;
    success(
      res,
      {
        token: {
          value: token,
          expirationTime,
        },
        user: safeUser,
      },
      `登录成功, 欢迎回来, ${user.name}`
    );
  } else {
    badRequest(res, "密码错误");
    errorPasswordCounter(String(user.id), "user");
    errorPasswordCounter(req.ip ?? "", "ip");
  }
}
