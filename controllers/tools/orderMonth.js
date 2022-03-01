const order = ["1月冬", "4月春", "7月夏", "10月秋", "剧场版", "其他地区", "三次元", "SP、OVA、OAD等", "OST、MV、LIVE等"]

function orderMonth(array) {
    if (!array) return []
    let array1 = [] // 拿来排序的数组
    for (i in array) {
        for (j in order) {
            if (array[i] == order[j]) {
                array1[j] = array[i]
            }
        }
    }
    let array2 = array1.filter(Boolean) // 拿来清除排序后的空项的数组, 以布尔值为条件过滤
    return array2
}

module.exports = orderMonth