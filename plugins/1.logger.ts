import chalk from "chalk";
import { H3Event } from "h3";
import moment from "moment";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("request", (event) => {
    event.context.startAt = new Date().getTime();
  });

  nitro.hooks.hook("afterResponse", async (event, { body }) => {
    await printLog(event).catch((error) => {
      console.error(error, "[hook] [afterResponse] 时打印 Log 发生错误");
    });
  });

  nitro.hooks.hook("error", async (error, { event }) => {
    await printLog(event).catch((error) => {
      console.error(error, "[hook] [error] 时打印 Log 发生错误");
    });
  });
});

async function printLog(event: H3Event) {
  const queryCost = new Date().getTime() - event.context.startAt;
  let user = await readUser(event).catch(() => null);
  let status = getResponseStatus(event);

  console.info(
    chalk.bgWhite(` ${moment().format("h:mm:ss A")} `),
    chalk.dim(getRequestIP(event, { xForwardedFor: true })),
    user ? chalk.dim(user?.name) : chalk.cyan("未登录"),
    chalk.bgCyan(` ${event.method} ${status} `),
    decodeURIComponent(event.path),
    // chalk.dim(getHeader(event, "Referer")),
    chalk.dim(queryCost, "ms")
  );
}
