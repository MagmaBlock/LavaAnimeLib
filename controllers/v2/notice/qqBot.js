import { qqBotAPI } from "../../../common/api.js";
import config from "../../../common/config.js";

export async function sendQQGroupMessage(message, group = 'main', useCQ = true) {
    if (!message) throw new Error('发送 QQ 群消息时未提供消息内容')
    let path = "/send_group_msg";
    let groupID = config.qqBotApi.group[group];
    let data = {
        "message": message,
        "group_id": groupID,
        "auto_escape": !useCQ
    }
    let result = await qqBotAPI.post(path, data)
    if (result.data.retcode == '0') return result.data
    else {
        console.log(result.data);
        console.log(`[QQ 消息] 发送群消息到 ${group}(${groupID}) 时 QQ bot 遇到意外`);
    }
}