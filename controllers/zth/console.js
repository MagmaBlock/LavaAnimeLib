const axios = require('axios')

const MCSMApi = 'http://plus.magma.ink/api/protected_instance/command'

function runConmand(req, res) {

    let ip = req.ip
    if (req.headers['x-real-ip']) { // 兼容nginx代理
        ip = req.headers['x-real-ip']
    }

    let command = req.body.command; // 获取客户端传入的命令或批量命令

    if (typeof command == 'string') { // 如果是字符串，说明是单条命令
        axios.get(MCSMApi, {
            params: {
                "uuid": "db14b4bcd9904b60a2d1af4e59c76917",
                "remote_uuid": "17141aaec43645f0b69051640ad68560",
                "apikey": "10a0b9e5dddb4824be17c1f84e10c5a5",
                "command": `${command}`
            }
        }).then((ret) => {
            let MCSMBack = ret.data
            if (ret.data.status == 200) {
                console.log(`[ZthBot][执行命令] ${ip} 执行了服务器命令: ${command}`)
                inGameLog(`API 执行 ${command}`)
                res.send(JSON.stringify({
                    code: 200,
                    message: "命令执行成功",
                    data: MCSMBack
                }))
            }
            else {
                res.send(JSON.stringify({
                    code: 400,
                    message: "MCSM 表示命令未执行成功",
                    data: MCSMBack
                }))
            }
        })
    }

    if (typeof command == 'object') { // 如果是数组，说明是批量命令
        for (i in command) {
            if (typeof command[i] != 'string') {
                res.send(JSON.stringify({
                    code: 400,
                    message: "批量命令中存在非字符串内容"
                }))
                return
            }
        }
        let commandList = []
        for (i in command) {
            let thisCommand = {
                "command": command[i],
                "try": false,
                "success": false
            }
            commandList.push(thisCommand)
        }
        for (let i = 0; i < commandList.length; i++) {
            axios.get(MCSMApi, {
                params: {
                    "uuid": "db14b4bcd9904b60a2d1af4e59c76917",
                    "remote_uuid": "17141aaec43645f0b69051640ad68560",
                    "apikey": "10a0b9e5dddb4824be17c1f84e10c5a5",
                    "command": `${commandList[i].command}`
                }
            }).then((ret) => {
                if (ret.data.status == 200) {
                    commandList[i].success = true
                    commandList[i].try = true
                    console.log(`[ZthBot][执行命令] ${ip} 正在批量执行服务器命令: ${commandList[i].command}`)
                    inGameLog(`API 执行 ${commandList[i].command}`)
                }
                else {
                    commandList[i].success = false
                    commandList[i].try = true // 虽然执行失败，但是不再重试
                    console.log(`[ZthBot][执行命令] ${ip} 正在批量执行服务器命令但是失败: ${commandList[i].command}`)
                }
            })
        }
        ifEnd()
        function ifEnd() {
            setTimeout(() => {
                for (i in commandList) {
                    if (commandList[i].try == false) {
                        ifEnd()
                        return
                    }
                }
                sendBack()
            }, 500)
        }
        function sendBack() {
            console.log(`[ZthBot][执行命令] ${ip} 批量执行服务器命令完成`);
            inGameLog(`批量指令执行完成`)
            res.send(JSON.stringify({
                code: 200,
                message: "批量命令执行成功",
                data: commandList
            }))
        }
    }
}

function inGameLog(logMessage) {
    axios.get(MCSMApi, {
        params: {
            "uuid": "db14b4bcd9904b60a2d1af4e59c76917",
            "remote_uuid": "17141aaec43645f0b69051640ad68560",
            "apikey": "10a0b9e5dddb4824be17c1f84e10c5a5",
            "command": `/ac &8${logMessage}`
        }
    }).catch({
        if(error) { throw error }
    })
}

module.exports = {
    runConmand
}