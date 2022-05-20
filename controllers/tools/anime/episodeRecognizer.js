const fs = require('fs');
const axios = require('axios');

go()
async function go() {
    let data = fs.readFileSync('newData.txt')
    let dataArray = data.toString().split('\n');
    // let dict = await axios('https://anime.magmablock.top/assets/dict.json');
    let dict = fs.readFileSync('dict.json').toString();
    dict = JSON.parse(dict);
    let resultArray = new Array();
    for (let i = 0; i < dataArray.length; i++) {
        let thisFileName = dataArray[i];
        // 用词典删除无用字符
        for (let j = 0; j < dict.length; j++) {
            thisFileName = thisFileName.replace(new RegExp(dict[j].from, 'gi'), '');
        }
        // 无关数据删除
        thisFileName = thisFileName.replace(/\[[^\d]*\]/g, " ").trim(); // 删除内部没有任何数字的 []
        thisFileName = thisFileName.replace(/S\d{1,2}/, '') // 删除 S02 / S2 这种季度标
        // 集数匹配
        thisFileEpisode = thisFileName.match(/(?<=\[)\d{1,2}(?=\]|_END|-END| {0,1}END\])/); // 集数匹配算法，匹配前后被 [] 包裹的 1-2 位数字, 或者是 END] 结尾
        if (thisFileEpisode == null) {
            thisFileEpisode = thisFileName.match(/ \d{1,2} /); // 集数匹配算法，匹配前后都是空格的 2 位数字
        }
        if (thisFileEpisode == null) {
            thisFileEpisode = thisFileName.match(/(?<=E)\d{1,2}/); // 集数匹配算法，匹配前后都是空格的 2 位数字
        }
        if (thisFileEpisode) { // 如果匹配到了，而且只匹配到一个结果
            if (thisFileEpisode.length == 1) {
                thisFileEpisode = thisFileEpisode[0].trim();
            }
        }
        resultArray.push({
            name: thisFileName,
            ep: thisFileEpisode
        });
    }
    console.log(JSON.stringify(resultArray));
}