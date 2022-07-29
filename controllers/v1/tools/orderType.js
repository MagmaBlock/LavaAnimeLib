const order = ["1月冬", "4月春", "7月夏", "10月秋", "剧场版", "其他地区", "三次元", "SP、OVA、OAD等", "OST、MV、LIVE等"]

export function orderType(array) {
    if (!array) return new Array();
    let array1 = new Array(); // 拿来排序的数组
    for (let i in array) {
        for (let j in order) {
            if (array[i] == order[j]) {
                array1[j] = array[i]
            }
        }
    }
    let array2 = array1.filter(Boolean) // 拿来清除排序后的空项的数组, 以布尔值为条件过滤
    return array2
}