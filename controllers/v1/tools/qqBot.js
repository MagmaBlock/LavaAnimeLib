import axios from "axios";

import config from "../../common/config.js";

export default {
    sendGroupMessage
}

function sendGroupMessage(group = "main", message, disableCQ = false) {
    return new Promise(async (resolve, reject) => {

        let apiUrl = config.qqBotApi.host + "/send_group_msg";
        let groupId = config.qqBotApi.group[group];
        let data = {
            "group_id": groupId,
            "message": message,
            "auto_escape": disableCQ
        }
        let result = await axios.post(apiUrl, data);
        if (result.data.retcode == '0') resolve(result.data);
        else reject(result.data);

    })
} 