import chalk from "chalk";
import dayjs from "dayjs";

export function logger() {
  let nowTime = dayjs().format('h:mm:ss A'); // 获取当前时间
  console.log(
    chalk.bgBlueBright(' ' + nowTime + ' '),
    ...arguments
  )
}