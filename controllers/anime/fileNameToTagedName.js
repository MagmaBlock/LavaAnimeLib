import axios from 'axios';

export let dict = []

function updateDict() {
    axios('https://anime.magmablock.top/assets/dict.json')
        .then(result => {
            dict = result.data;
            console.log('[定时刷新词典] 已从前端刷新词典，数量', dict.length);
            setTimeout(() => { updateDict() }, 1000 * 60 * 60 * 8); // 每8小时刷新一次
        })
        .catch(error => {
            console.log('[定时刷新词典] 刷新失败，一分钟后重试');
            setTimeout(() => { updateDict() }, 1000 * 60); // 遇到错误，等一分钟后重试
        })
};
updateDict();

export function fileNameToTagedName(fileName, dict) {

    // 先进行简单拆分，只用 [ ] & + 拆开文件名
    let splitedFileName = fileName.split(/\[|\]|&|\+/); // 拆分
    for (let i = 0; i < splitedFileName.length; i++) { // 对文件名中的每个词进行判断
        splitedFileName[i] = splitedFileName[i].trim() // 去除首尾空格
        if (splitedFileName[i] == '') {
            splitedFileName.splice(i, 1) // 去除空元素
            i = i - 1;
        }
    }

    // 判断前三个词是否是发布组名
    let groupNames = new Array(); // 找到的发布组名会存在此内
    let forTimes = splitedFileName.length >= 3 ? 3 : splitedFileName.length - 1; // 如果文件名长度大于等于3, 则只判断前三个词
    for (let i = 0; i < forTimes; i++) { // 把数组的前三个元素和发布组的词典进行比对，这已是发布组名可能出现位置的极限
        for (let j = 0; j < dict.length; j++) { // 遍历词典
            // 如果词典中的词是发布组词，且匹配成功
            if (dict[j].class == 'group' && splitedFileName[i].match(new RegExp(dict[j].from, 'i'))) {
                groupNames.push(dict[j].to) // 将发布组词添加到 groupNames 中
                splitedFileName.splice(i, 1) // 删除匹配成功的词
                i = i - 1; // 因为删除了一个元素, 所以 i 减 1
                break;
            }
        }
    }

    // 将文件名拼回来，然后拆的更散
    let reformedFileName = ''
    for (let i = 0; i < splitedFileName.length; i++) {
        if (i < splitedFileName.length) reformedFileName = reformedFileName + splitedFileName[i] + "|";
        if (i == splitedFileName.length) reformedFileName = reformedFileName + splitedFileName[i];
    }
    reformedFileName = reformedFileName.split(/\||\(|\)|-|_| /) // 这次用 | ( ) - _ 还有空格拆开
    for (let i = 0; i < reformedFileName.length; i++) { // 对文件名中的每个词进行判断
        reformedFileName[i] = reformedFileName[i].trim() // 去除首尾空格
        if (reformedFileName[i] == '') {
            reformedFileName.splice(i, 1) // 去除空元素
            i = i - 1;
        }
    }

    // 开始用词典进行标签化
    for (let i = 0; i < reformedFileName.length; i++) {
        for (let j = 0; j < dict.length; j++) {
            let thisRegExp = new RegExp(dict[j].from, 'i')
            if (reformedFileName[i].replace(thisRegExp, '').trim() == '') {
                // console.log('原文: ', reformedFileName[i]);
                // console.log("正则: ", dict[j].from, "匹配: ", match)
                reformedFileName[i] = {
                    tag: dict[j].to,
                    from: reformedFileName[i],
                    type: dict[j].class,
                    regExp: thisRegExp
                };
                break;
            }
        }
    }

    // 开始识别文件集数
    let thisFileEpisode // 此处是 undefined，如果后面匹配失败，则是 null

    for (let i = reformedFileName.length; i > 0; i--) { // 习惯情况下均为集数在后，所以从后往前匹配
        if (typeof reformedFileName[i] == 'string') { // 如果是字符串
            // ↓ 这里是当前遍历的，被上面的算法识别完成后仍然为字符串的元素，顺带删除 S02 / S2 这种季度标
            let thisString = reformedFileName[i].replace(/S\d{1,2}/i, '');
            // 集数匹配算法，匹配 1-2 位数字
            thisFileEpisode = thisString.match(/(EP|E|P|)\d{1,2}(END|v2|v3|.5|)/i);
            if (thisFileEpisode) { // 如果匹配成功
                if (thisFileEpisode[0] != thisFileEpisode.input) {
                    console.log('丢弃非全匹配', ` ${thisFileEpisode[0]} => ${thisFileEpisode.input}`);
                    thisFileEpisode = null; // 如果不是全匹配，丢弃
                    continue;
                }
                thisFileEpisode = thisFileEpisode[0];
                thisFileEpisode = thisFileEpisode.replace(/v2|v3|END|EP|E|P/gi, '')
                break;
            }
        }
    }

    if (thisFileEpisode == undefined || thisFileEpisode == null) { // Failed
        thisFileEpisode = '';
    }
    let noEpisode = !(fileName.endsWith('.mkv') || fileName.endsWith('.mp4')); // 仅 mkv 或 mp4 文件识别集数才有意义
    if (noEpisode) thisFileEpisode = ''

    return { groupNames, reformedFileName, thisFileEpisode }; // 返回发布组名和标签化的文件名

}