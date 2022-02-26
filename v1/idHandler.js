function idHandler(id) {

    if (id == '') { // 处理没有指定 ID 的情况
        return id = undefined
    }
    else {
        id = id.match(/^[A-Za-z0-9]+$/); // 去除非法字符
        if (id) { id = id.toString() } // 将数组转换为字符串
        // console.log('[验证ID]', id);
        if (!id || id.length > 12) { // 如果 ID 中有非法字符或太长
            console.error('[解析错误]', 'ID 中有非法字符或太长');
            return id = undefined
        }
        if (id.match(/DROP|SELECT|DISTINCT|WHERE|AND|OR|INSERT|UPDATE|DELETE/gi)) {
            console.error('[异常警告]', '请求中包含SQL关键字');
            return id = undefined
        }
        return id;
    }
}

function textHandler(text) {
    if (text == '') {
        return text = undefined
    }
    else {
        if (text.match(/DROP|SELECT|DISTINCT|WHERE|AND|OR|INSERT|UPDATE|DELETE/gi)) {
            console.error('[异常警告]', '请求中包含SQL关键字');
            return text = undefined
        }
        if (text.match(/\'|\"|\`|\<|\>|\=|\*|\\|\?/)) {
            console.error(`[解析错误]', '请求中包含特殊字符`);
        }
        return text;
    }
}


module.exports = {
    idHandler,
    textHandler
}