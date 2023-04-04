const dict = {
    group: [
        { from: /DMHY/ig, to: "動漫花園" },
        { from: /SHIGURE/ig, to: "時雨初空" },
        { from: /HYSUB/ig, to: "幻樱字幕组" },
        { from: /BeanSub/ig, to: "豌豆字幕组" },
        { from: /FZSD/ig, to: "风之圣殿" },
        { from: /FLsnow/ig, to: "雪飘工作室" },
        { from: /WMSUB/ig, to: "风车字幕组" },
        { from: /DBD-Raws/ig, to: "DBD 制作组" },
        { from: /UHA-WING(S|)/ig, to: "悠哈璃羽字幕社" },
        { from: /SweetSub/ig, to: "SweetSub 字幕组" },
        { from: /MMSUB/ig, to: "MMSUB" },
        { from: /LoliHouse/ig, to: "LoliHouse 压制组" },
        { from: /SFEO-Raws/ig, to: "SFEO-Raws 压制组" },
        { from: /SumiSora/ig, to: "澄空学园" },
        { from: /YUI-7/ig, to: "西农YUI汉化组" },
        { from: /Skymoon-Raws/ig, to: "天月動漫&發佈組" },
        { from: /PCSUB/ig, to: "波洛咖啡厅" },
        { from: /Kamigami/ig, to: "诸神字幕组" },
        { from: /Mabors( |-)Sub/ig, to: "幻之字幕组" },
        { from: /DHR/ig, to: "DHR动研字幕组" },
        { from: /DMG/ig, to: "动漫国字幕组" },
        { from: /FZsub/ig, to: "F宅字幕组" },
        { from: /Xrip/ig, to: "Xrip 压制组" },
        { from: /A\.I\.R\.nesSub/ig, to: "A.I.R.nesSub 字幕组" },
        { from: /NC-Raws|まひろ🍥|神楽坂 まひろ|【推しの子】/ig, to: "NC-Raws 搬运组" },
        { from: /NaN-Raws/ig, to: "NaN-Raws 搬运组" },
        { from: /Lilith-Raws/ig, to: "Lilith-Raws 搬运组" },
        { from: /云光字幕组/ig, to: "云光字幕组" },
        { from: /CASO/ig, to: "华盟字幕组" },
        { from: /Comicat/ig, to: "漫猫字幕组" },
        { from: /KissSub/ig, to: "爱恋字幕组" },
        { from: /JYFanSub|KTXP|JYSUB|JYFANSUB/ig, to: "极影字幕社" },
        { from: /Nekomoe kissaten/ig, to: "喵萌奶茶屋" },
        { from: /Mmch\.sub/ig, to: "喵萌茶会字幕组" },
        { from: /sakurato\.sub|Sakurato/ig, to: "桜都字幕组" },
        { from: /STYHSub/ig, to: "霜庭云花字幕组" },
        { from: /Airota|Ariota/ig, to: "千夏字幕组" },
        { from: /SZW/ig, to: "森之屋动漫" },
        { from: /SAIO-Raws/ig, to: "SAIO-Raws 压制组" },
        { from: /VCB-Studio|VCB-S/ig, to: "VCB-Studio 压制组" },
        { from: /熔岩番剧库|LavaAnimeLib/ig, to: "番剧库压制" },
        { from: /异域-11番小队/ig, to: "异域-11番小队" },
        { from: /XKSub/ig, to: "星空字幕组" },
        { from: /ZeroSub/ig, to: "ZeroSub" },
        { from: /CoolComic404/ig, to: "酷漫404" },
        { from: /orion origin/ig, to: "猎户不鸽发布组" },
        { from: /MCE/ig, to: "MCE 汉化组" },
        { from: /LavaAnime/ig, to: "熔岩动画" },
        { from: /igsub/ig, to: "爱咕字幕组" },
        { from: /GST/ig, to: "GST 搬运组" },
        { from: /LxyLab/ig, to: "LxyLab 字幕组" },
        { from: /LKSUB/ig, to: "轻之国度字幕组" },
        { from: /Henshin/ig, to: "Henshin 压制组" },
        { from: /LPSub/ig, to: "离谱Sub" },
        { from: /(MingYSub|MingY)/ig, to: "MingYSub" },
        { from: /WOLF\&RH/ig, to: "WOLF&RH 字幕组" },
        { from: /Hakugetsu/ig, to: "白月字幕组" },
        { from: /夏沐字幕组/ig, to: "夏沐字幕组" },
        { from: /KyokuSai/ig, to: "极彩字幕组" },
        { from: /Meowskers/ig, to: "喵鲁字幕组" },
        { from: /Amor字幕组/ig, to: "Amor 字幕组" },
        { from: /POPGO/ig, to: "漫游字幕组" },
        { from: /Moozzi2/ig, to: "Moozzi2 压制组" },
        { from: /mawen1250/ig, to: "mawen1250 压制组" },
        { from: /ANK-Raws/ig, to: "ANK-Raws 压制组" },
        { from: /Snow-Raws/ig, to: "花園壓制組" },
        { from: /Haruhana/ig, to: "拨雪寻春字幕组" },
        { from: /RATH/ig, to: "拉斯观测组" },
        { from: /SBSUB/ig, to: "银色子弹字幕组" },
        { from: /织梦字幕组/ig, to: "织梦字幕组" },
        { from: /Billion Meta Lab/ig, to: "亿次研同好会" },
        { from: /LavaAnimeSub/ig, to: "熔岩动画Sub" },
        { from: /Kitaujisub/ig, to: "北宇治字幕组"}
    ],
    source: [
        { from: /TVRip|TV/ig, to: "TV放送源" },
        { from: /WEBRip|WEB/ig, to: "网络源" },
        { from: /BDRip|BD/ig, to: "蓝光盘源" },
        { from: /DVDRip|DVD/ig, to: "DVD 源" },
        { from: /AT-X/ig, to: "AT-X" },
        { from: /Baha/ig, to: "巴哈姆特动画疯" },
        { from: /B-Global/ig, to: "哔哩哔哩国际" },
        { from: /CR/ig, to: "Crunchyroll" },
        { from: /Sentai/ig, to: "Hidive" },
        { from: /BiliBili|BL/ig, to: "哔哩哔哩动画" },
        { from: /(Acfun|AC)/ig, to: "Acfun" },
        { from: /(netflix|NF)/ig, to: "Netflix" },
    ],
    quality: [
        { from: /(1080P|1920(X|×)(1080|816))/ig, to: "1080P" },
        { from: /2160P|3840(X|×)2160/ig, to: "2160P(4K)" },
        { from: /1440P|2560(X|×)1440/ig, to: "1440P(2K)" },
        { from: /(720P|1280(X|×)720)/ig, to: "720P" },
        { from: /(480P|864(X|×)480)/ig, to: "480P" },
        { from: /(810P)/ig, to: "810P" },
        { from: /60fps/ig, to: "60FPS" },
        { from: /(AVC|x264|H264)/ig, to: "AVC" },
        { from: /(HEVC|x265|H265)/ig, to: "HEVC" },
        { from: /Ma10p/ig, to: "Ma10p" },
        { from: /Main10/ig, to: "Main10" },
        { from: /8Bits|8Bit/ig, to: "8bit 色深" },
        { from: /Hi10p|10Bits|10Bit/ig, to: "10位色" },
        { from: /yuv420p10/ig, to: "YUV-4:2:0 10位色" },
        { from: /yuv420p8/ig, to: "YUV-4:2:0 8位色" },
        { from: /(\d(AAC|ACC))|((AAC|ACC)(x|×)\d)|(ACC|AAC)/ig, to: "AAC" },
        { from: /FLAC(x|×)\d|\dFLAC|FLAC/ig, to: "Flac" },
        { from: /OPUS(x|×)\d|\dOPUS|OPUS/ig, to: "OPUS" },
        { from: /AC3/ig, to: "杜比数码环绕声" },
        { from: /mp4/ig, to: "MP4" },
        { from: /mkv/ig, to: "MKV" },
    ],
    language: [
        { from: /LavaASS/ig, to: "番剧库内封(已弃用技术)" },
        { from: /(GB_CN|GB|SC|CHS|CH(?=[^T])|简体中文|简体|简中)/ig, to: "简中" },
        { from: /(BIG5|TC|CHT)/ig, to: "繁中" },
        { from: /JPSC|CHS_JP|Chs,Jap|简体双语/ig, to: "简日双语" },
        { from: /JSTC|CHT_JP/ig, to: "繁日双语" },
        { from: /Chs,Cht,Jap/ig, to: "简繁日多语" },
        { from: /CN/ig, to: "中文" },
        { from: /ENG/ig, to: "英语" },
        { from: /(JPN|JAP|JP)/ig, to: "日语" },
        { from: /TH/ig, to: "泰语" },
        { from: /V2/ig, to: "第2版" },
        { from: /V3/ig, to: "第3版" },
        // { from: /Final/ig, to: "最终版本" },
        { from: /ASS(x|×)\d/ig, to: "多语言特效字幕" },
        { from: /ASS/ig, to: "特效字幕" },
        { from: /SRT(x|×)\d/ig, to: "多语言SRT字幕" },
        { from: /SRT/ig, to: "SRT字幕" },
        { from: /Sub/ig, to: "字幕" },
    ],
    other: [
        { from: /SP/ig, to: "SP" },
        { from: /OVA/ig, to: "OVA" },
        { from: /Movie/ig, to: "剧场版" },
        { from: /Subtitles|Subtitle|Subs/ig, to: "外挂字幕合集包" },
        { from: /Fonts|Font/ig, to: "字体合集包" },
        { from: /NCOP/ig, to: "素材 - 无字 OP" },
        { from: /NCOP1/ig, to: "素材 - 无字 OP 1" },
        { from: /NCOP2/ig, to: "素材 - 无字 OP 2" },
        { from: /NCOP3/ig, to: "素材 - 无字 OP 3" },
        { from: /NCOP4/ig, to: "素材 - 无字 OP 4" },
        { from: /NCOP5/ig, to: "素材 - 无字 OP 5" },
        { from: /NCOP6/ig, to: "素材 - 无字 OP 6" },
        { from: /NCED/ig, to: "素材 - 无字 ED" },
        { from: /NCED1/ig, to: "素材 - 无字 ED 1" },
        { from: /NCED2/ig, to: "素材 - 无字 ED 2" },
        { from: /NCED3/ig, to: "素材 - 无字 ED 3" },
        { from: /NCED4/ig, to: "素材 - 无字 ED 4" },
        { from: /NCED5/ig, to: "素材 - 无字 ED 5" },
        { from: /NCED6/ig, to: "素材 - 无字 ED 6" },
    ],
    format: [ // 此中的正则会单独对整个文件名匹配一次，不会和其他的冲突
        { from: /ass/ig, to: "ASS外挂字幕", type: 'subtitle' },
        { from: /mp4/ig, to: "MP4视频", type: 'video' },
        { from: /mkv/ig, to: "MKV视频", type: 'video' },
        { from: /(png|jpg|jpeg|gif|bmp|tif|svg)/ig, to: "图片", type: 'image' },
        { from: /torrent/ig, to: "种子文件", type: 'torrent' },
        { from: /txt/ig, to: "TXT文档", type: 'document' },
        { from: /(pdf|docx|doc)/ig, to: "文档", type: 'document' },
        { from: /(mp3)/ig, to: "MP3音乐", type: 'music' },
        { from: /(flac)/ig, to: "FLAC无损音乐", type: 'music' },
        { from: /(zip|rar|7z)/ig, to: "压缩文件", type: 'archive' },
    ],
    delete: [
        /(招募(翻译|时轴后期|后期|时轴))|(new-ani.me)|((1|4|7|10|一|四|七|十)月新番)/ig,
        /[A-F\d]{8}/ig, // CRC32 校验码
        /DL/ig
    ]
}

export default dict


export let testFiles =
    [
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 01 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 02 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 03 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 04 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 05 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 06 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 07 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 08 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 09 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 10 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 11 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 12 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Love Live! Nijigasaki Gakuen School Idol Doukoukai S2 - 13 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[MingY] RPG Fudousan [01][1080p][CHS].mp4',
        '[MingY] RPG Fudousan [02][1080p][CHS].mp4',
        '[MingY] RPG Fudousan [03][1080p][CHS].mp4',
        '[MingY] RPG Fudousan [04][1080p][CHS].mp4',
        '[MingY] RPG Fudousan [05][1080p][CHS].mp4',
        '[MingY] RPG Fudousan [06][1080p][CHS].mp4',
        '[MingY] RPG Fudousan [07][1080p][CHS].mp4',
        '[MingY] RPG Fudousan [08][1080p][CHS].mp4',
        '[MingY] RPG Fudousan [09][1080p][CHS].mp4',
        '[MingY] RPG Fudousan [10][1080p][CHS].mp4',
        '[MingY] RPG Fudousan [11][1080p][CHS].mp4',
        '[MingY] RPG Fudousan [12][1080p][CHS].mp4',
        '[HYSUB]Komi-san wa, Komyushou Desu.[13][GB_MP4][1920X1080].mp4',
        '[HYSUB]Komi-san wa, Komyushou Desu.[14][GB_MP4][1920X1080].mp4',
        '[HYSUB]Komi-san wa, Komyushou Desu.[15][GB_MP4][1920X1080].mp4',
        '[HYSUB]Komi-san wa, Komyushou Desu.[16][GB_MP4][1920X1080].mp4',
        '[HYSUB]Komi-san wa, Komyushou Desu.[17][GB_MP4][1920X1080].mp4',
        '[HYSUB]Komi-san wa, Komyushou Desu.[18][GB_MP4][1920X1080].mp4',
        '[HYSUB]Komi-san wa, Komyushou Desu.[19][GB_MP4][1920X1080].mp4',
        '[HYSUB]Komi-san wa, Komyushou Desu.[20][GB_MP4][1920X1080].mp4',
        '[HYSUB]Komi-san wa, Komyushou Desu.[21][GB_MP4][1920X1080].mp4',
        '[HYSUB]Komi-san wa, Komyushou Desu.[22][GB_MP4][1920X1080].mp4',
        '[HYSUB]Komi-san wa, Komyushou Desu.[23][GB_MP4][1920X1080].mp4',
        '[HYSUB]Komi-san wa, Komyushou Desu.[24v2][GB_MP4][1920X1080][END].mp4',
        '[夏沐字幕组][4月新番][史上最强的大魔王转生为村民A][01][x264 10bit][1080p][简体中文].mp4',
        '[夏沐字幕组][4月新番][史上最强的大魔王转生为村民A][02][x264 10bit][1080p][简体中文].mp4',
        '[夏沐字幕组][4月新番][史上最强的大魔王转生为村民A][03][x264 10bit][1080p][简体中文].mp4',
        '[夏沐字幕组][4月新番][史上最强的大魔王转生为村民A][04][x264 10bit][1080p][简体中文].mp4',
        '[夏沐字幕组][4月新番][史上最强的大魔王转生为村民A][05][x264 10bit][1080p][简体中文].mp4',
        '[夏沐字幕组][4月新番][史上最强的大魔王转生为村民A][06][x264 10bit][1080p][简体中文].mp4',
        '[夏沐字幕组][4月新番][史上最强的大魔王转生为村民A][07][x264 10bit][1080p][简体中文].mp4',
        '[夏沐字幕组][4月新番][史上最强的大魔王转生为村民A][08][x264 10bit][1080p][简体中文].mp4',
        '[夏沐字幕组][4月新番][史上最强的大魔王转生为村民A][09][x264 10bit][1080p][简体中文].mp4',
        '[夏沐字幕组][4月新番][史上最强的大魔王转生为村民A][10][x264 10bit][1080p][简体中文].mp4',
        '[夏沐字幕组][4月新番][史上最强的大魔王转生为村民A][11][x264 10bit][1080p][简体中文].mp4',
        '[夏沐字幕组][4月新番][史上最强的大魔王转生为村民A][12][x264 10bit][1080p][简体中文].mp4',
        '[Nekomoe kissaten] Shokei Shoujo no Virgin Road 01 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten] Shokei Shoujo no Virgin Road 02 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten] Shokei Shoujo no Virgin Road 03 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten] Shokei Shoujo no Virgin Road 04 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten] Shokei Shoujo no Virgin Road 05 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten] Shokei Shoujo no Virgin Road 06 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten][Shokei Shoujo no Virgin Road][09][1080p][CHS].mp4',
        '[UHA-WINGS] Shokei Shoujo no Virgin Road - 07 [x264 1080p][CHS].mp4',
        '[UHA-WINGS] Shokei Shoujo no Virgin Road - 08 [x264 1080p][CHS].mp4',
        '[UHA-WINGS] Shokei Shoujo no Virgin Road - 10 [x264 1080p][CHS].mp4',
        '[UHA-WINGS] Shokei Shoujo no Virgin Road - 11 v2 [x264 1080p][CHS].mp4',
        '[UHA-WINGS] Shokei Shoujo no Virgin Road - 12 [x264 1080p][CHS].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][01][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][02][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][03][1080p][JPSC][v2].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][04][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][05][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][06][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][07][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][08][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][09][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][10][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][11][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][12][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][13][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][14][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][15][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][16][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Summer Time Rendering][17][1080p][JPSC].mp4',
        '[Meowskers][Shadowverse Flame][01][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][02][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][03][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][04][1080p][CHS].mp4',
        '[Meowskers][Shadowverse Flame][05][1080p][CHS].mp4',
        '[Meowskers][Shadowverse Flame][06][1080p][CHS].mp4',
        '[Meowskers][Shadowverse Flame][07][1080p][CHS].mp4',
        '[Meowskers][Shadowverse Flame][08][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][09][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][10][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][11][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][12][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][13][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][14][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][15][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][16][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][17][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][18][1080P][CHS].mp4',
        '[Meowskers][Shadowverse Flame][19][1080P][CHS].mp4',
        '[LoliHouse] Koi wa Sekai Seifuku no Ato de - 01 [WebRip 1080p HEVC-10bit AAC SRTx2].mkv',
        '[LoliHouse] Koi wa Sekai Seifuku no Ato de - 02 [WebRip 1080p HEVC-10bit AAC SRTx2].mkv',
        '[LoliHouse] Koi wa Sekai Seifuku no Ato de - 03 [WebRip 1080p HEVC-10bit AAC SRTx2].mkv',
        '[LoliHouse] Koi wa Sekai Seifuku no Ato de - 04 [WebRip 1080p HEVC-10bit AAC SRTx2].mkv',
        '[LoliHouse] Koi wa Sekai Seifuku no Ato de - 05 [WebRip 1080p HEVC-10bit AAC SRTx2].mkv',
        '[LoliHouse] Koi wa Sekai Seifuku no Ato de - 06 [WebRip 1080p HEVC-10bit AAC SRTx2].mkv',
        '[LoliHouse] Koi wa Sekai Seifuku no Ato de - 07 [WebRip 1080p HEVC-10bit AAC SRTx2].mkv',
        '[LoliHouse] Koi wa Sekai Seifuku no Ato de - 08 [WebRip 1080p HEVC-10bit AAC SRTx2].mkv',
        '[LoliHouse] Koi wa Sekai Seifuku no Ato de - 09 [WebRip 1080p HEVC-10bit AAC SRTx2].mkv',
        '[LoliHouse] Koi wa Sekai Seifuku no Ato de - 10 [WebRip 1080p HEVC-10bit AAC SRTx2].mkv',
        '[LoliHouse] Koi wa Sekai Seifuku no Ato de - 11 [WebRip 1080p HEVC-10bit AAC SRTx2].mkv',
        '[LoliHouse] Koi wa Sekai Seifuku no Ato de - 12 [WebRip 1080p HEVC-10bit AAC SRTx2].mkv',
        '[NC-Raws] 式守同學不只可愛而已 - 11 (Baha 1920x1080 AVC AAC MP4) [64F9F9DE].mp4',
        '[NC-Raws] 式守同學不只可愛而已 - 12 (Baha 1920x1080 AVC AAC MP4) [F08001A8].mp4',
        '[NC-Raws] 式守同學不只可愛而已 - 8.5 (Baha 1920x1080 AVC AAC MP4) [75B47E53].mp4',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [01][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [02][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [03v2][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [03][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [04][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [05][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [06][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [07][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [08][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [09][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [10][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [11][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [12][HEVC-10bit 1080p AAC][CHS&CHT].mkv',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [Fonts].zip',
        '[Sakurato] Kawaii Dake ja Nai Shikimori-san [Subtitles].zip',
        '[HYSUB][Tomodachi Game][01v2][GB_MP4][1280X720].mp4',
        '[HYSUB][Tomodachi Game][02v2][GB_MP4][1280X720].mp4',
        '[HYSUB][Tomodachi Game][03][GB_MP4][1280X720].mp4',
        '[HYSUB][Tomodachi Game][04][GB_MP4][1280X720].mp4',
        '[HYSUB][Tomodachi Game][05][GB_MP4][1280X720].mp4',
        '[HYSUB][Tomodachi Game][06][GB_MP4][1280X720].mp4',
        '[HYSUB][Tomodachi Game][07][GB_MP4][1280X720].mp4',
        '[HYSUB][Tomodachi Game][08][GB_MP4][1280X720].mp4',
        '[HYSUB][Tomodachi Game][09][GB_MP4][1280X720].mp4',
        '[HYSUB][Tomodachi Game][10v2][GB_MP4][1280X720].mp4',
        '[HYSUB][Tomodachi Game][10][GB_MP4][1280X720].mp4',
        '[HYSUB][Tomodachi Game][11][GB_MP4][1280X720].mp4',
        '[HYSUB][Tomodachi Game][12][end][GB_MP4][1280X720].mp4',
        '[NC-Raws] 杜鵑婚約 - 14 (Baha 1920x1080 AVC AAC MP4) [FFB6516E].mp4',
        '[NC-Raws] 杜鵑婚約 - 15 (Baha 1920x1080 AVC AAC MP4) [663DB5CA].mp4',
        '[NC-Raws] 杜鵑婚約 [特別篇] - 14 (Baha 1920x1080 AVC AAC MP4) [3BCE7809].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][01][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][02][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][03][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][04][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][05][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][06][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][07][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][08][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][09][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][10][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][11][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][12][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][13][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iikagen][14][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][01][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][02][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][03][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][04][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][05][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][06][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][07][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][08][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][09][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][10][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][11][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][12][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][13][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][14][1080p][CHS].mp4',
        '[Nekomoe kissaten][Kakkou no Iinazuke][15][1080p][CHS].mp4',
        '[Nekomoe kissaten][Healer Girl][01][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Healer Girl][02][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Healer Girl][03][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Healer Girl][04][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Healer Girl][05][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Healer Girl][06][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Healer Girl][07][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Healer Girl][08][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Healer Girl][09][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Healer Girl][10][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Healer Girl][11][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Healer Girl][12][1080p][JPSC].mp4',
        '[LavaAnime] Paripi Koumei [06v2][CHS][1080P][AVC AAC].mp4',
        '[LavaAnime] Paripi Koumei [07v2][CHS][1080P][AVC AAC].mp4',
        '[LavaAnime] Paripi Koumei [08][CHS][1080P][AVC AAC].mp4',
        '[LavaAnime] Paripi Koumei [09][CHS][1080P][AVC AAC].mp4',
        '[LavaAnime] Paripi Koumei [10][CHS][1080P][AVC AAC].mp4',
        '[LavaAnime] Paripi Koumei [11][CHS][1080P][AVC AAC].mp4',
        '[LavaAnime] Paripi Koumei [12 END][CHS][1080P][AVC AAC].mp4',
        '[Nekomoe kissaten&LoliHouse] Paripi Koumei - 01 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten&LoliHouse] Paripi Koumei - 02 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten&LoliHouse] Paripi Koumei - 03 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten&LoliHouse] Paripi Koumei - 04 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten&LoliHouse] Paripi Koumei - 05 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten&LoliHouse] Paripi Koumei - 06 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten&LoliHouse] Paripi Koumei - 07 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten&LoliHouse] Paripi Koumei - 08 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten&LoliHouse] Paripi Koumei - 09 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten&LoliHouse] Paripi Koumei - 10 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Nekomoe kissaten][Paripi Koumei][01][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Paripi Koumei][02][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Paripi Koumei][03][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Paripi Koumei][04][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Paripi Koumei][05][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Paripi Koumei][06][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Paripi Koumei][07][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Paripi Koumei][08][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Paripi Koumei][09][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Paripi Koumei][10][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Paripi Koumei][11][1080p][JPSC].mp4',
        '[Nekomoe kissaten][Paripi Koumei][12][1080p][JPSC].mp4',
        '[Airota&LoliHouse] Aharen-san wa Hakarenai - 01 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Aharen-san wa Hakarenai - 02 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Aharen-san wa Hakarenai - 03 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Aharen-san wa Hakarenai - 04 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Aharen-san wa Hakarenai - 05 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Aharen-san wa Hakarenai - 06 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Aharen-san wa Hakarenai - 07 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Aharen-san wa Hakarenai - 08 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Aharen-san wa Hakarenai - 09 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Aharen-san wa Hakarenai - 10 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LavaAnime] Aharen-San Wa Hakarenai [01][CHS][1080P][AVC AAC].mp4',
        '[LavaAnime] Aharen-San Wa Hakarenai [02][CHS][1080P][AVC AAC].mp4',
        '[MingY] Aharen-san wa Hakarenai [03][1080p][CHS].mp4',
        '[MingY] Aharen-san wa Hakarenai [04][1080p][CHS].mp4',
        '[MingY] Aharen-san wa Hakarenai [05][1080p][CHS].mp4',
        '[MingY] Aharen-san wa Hakarenai [06][1080p][CHS].mp4',
        '[MingY] Aharen-san wa Hakarenai [07][1080p][CHS].mp4',
        '[MingY] Aharen-san wa Hakarenai [08][1080p][CHS].mp4',
        '[MingY] Aharen-san wa Hakarenai [09][1080p][CHS].mp4',
        '[MingY] Aharen-san wa Hakarenai [10][1080p][CHS].mp4',
        '[MingY] Aharen-san wa Hakarenai [11][1080p][CHS].mp4',
        '[MingY] Aharen-san wa Hakarenai [12][1080p][CHS].mp4',
        '[LoliHouse] Rikei ga Koi ni Ochita no de Shoumei shitemita S2 - 02 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Rikei ga Koi ni Ochita no de Shoumei shitemita S2 - 03 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[LoliHouse] Rikei ga Koi ni Ochita no de Shoumei shitemita S2 - 04 [WebRip 1080p HEVC-10bit AAC].mkv',
        '[LoliHouse] Rikei ga Koi ni Ochita no de Shoumei shitemita S2 - 05 [WebRip 1080p HEVC-10bit AAC].mkv',
        '[LoliHouse] Rikei ga Koi ni Ochita no de Shoumei shitemita S2 - 06 [WebRip 1080p HEVC-10bit AAC].mkv',
        '[LoliHouse] Rikei ga Koi ni Ochita no de Shoumei shitemita S2 - 07 [WebRip 1080p HEVC-10bit AAC].mkv',
        '[LoliHouse] Rikei ga Koi ni Ochita no de Shoumei shitemita S2 - 08 [WebRip 1080p HEVC-10bit AAC].mkv',
        '[LoliHouse] Rikei ga Koi ni Ochita no de Shoumei shitemita S2 - 09 [WebRip 1080p HEVC-10bit AAC].mkv',
        '[LoliHouse] Rikei ga Koi ni Ochita no de Shoumei shitemita S2 - 10 [WebRip 1080p HEVC-10bit AAC].mkv',
        '[LoliHouse] Rikei ga Koi ni Ochita no de Shoumei shitemita S2 - 11 [WebRip 1080p HEVC-10bit AAC].mkv',
        '[LoliHouse] Rikei ga Koi ni Ochita no de Shoumei shitemita S2 - 12 [WebRip 1080p HEVC-10bit AAC].mkv',
        '[Nekomoe kissaten][Deaimon][01][1080p][CHS].mp4',
        '[Nekomoe kissaten][Deaimon][02][1080p][CHS].mp4',
        '[Nekomoe kissaten][Deaimon][03][1080p][CHS].mp4',
        '[Nekomoe kissaten][Deaimon][04][1080p][CHS].mp4',
        '[Nekomoe kissaten][Deaimon][05][1080p][CHS].mp4',
        '[Nekomoe kissaten][Deaimon][06][1080p][CHS].mp4',
        '[Nekomoe kissaten][Deaimon][07][1080p][CHS].mp4',
        '[Nekomoe kissaten][Deaimon][08][1080p][CHS].mp4',
        '[Nekomoe kissaten][Deaimon][09][1080p][CHS].mp4',
        '[Nekomoe kissaten][Deaimon][10][1080p][CHS].mp4',
        '[Nekomoe kissaten][Deaimon][11][1080p][CHS].mp4',
        '[Nekomoe kissaten][Deaimon][12][1080p][CHS].mp4',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [01][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [02][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [03][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [04][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [05][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [06][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [07][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [08][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [09][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [10][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [11][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [12][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[Sakurato] Tate no Yuusha no Nariagari Season2 [13][HEVC-10bit 1080P AAC][CHS&CHT].mkv',
        '[MingY] Shachiku-san wa Youjo Yuurei ni Iyasaretai [01][1080p][CHS].mp4',
        '[MingY] Shachiku-san wa Youjo Yuurei ni Iyasaretai [02][1080p][CHS].mp4',
        '[MingY] Shachiku-san wa Youjo Yuurei ni Iyasaretai [03][1080p][CHS].mp4',
        '[MingY] Shachiku-san wa Youjo Yuurei ni Iyasaretai [04][1080p][CHS].mp4',
        '[MingY] Shachiku-san wa Youjo Yuurei ni Iyasaretai [05][1080p][CHS].mp4',
        '[MingY] Shachiku-san wa Youjo Yuurei ni Iyasaretai [06][1080p][CHS].mp4',
        '[MingY] Shachiku-san wa Youjo Yuurei ni Iyasaretai [07][1080p][CHS].mp4',
        '[MingY] Shachiku-san wa Youjo Yuurei ni Iyasaretai [08][1080p][CHS].mp4',
        '[MingY] Shachiku-san wa Youjo Yuurei ni Iyasaretai [09][1080p][CHS].mp4',
        '[MingY] Shachiku-san wa Youjo Yuurei ni Iyasaretai [10][1080p][CHS].mp4',
        '[MingY] Shachiku-san wa Youjo Yuurei ni Iyasaretai [11][1080p][CHS].mp4',
        '[MingY] Shachiku-san wa Youjo Yuurei ni Iyasaretai [12][1080p][CHS].mp4',
        '[Airota&LoliHouse] Date a Live IV - 01 [WebRip 1080p HEVC-10bit AAC].mkv',
        '[Airota&LoliHouse] Date A Live IV - 02 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Date A Live IV - 03 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Date A Live IV - 04 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Date A Live IV - 05 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Date A Live IV - 06 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Airota&LoliHouse] Date A Live IV - 07 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[Date a Live IV][01][BIG5][1080P].mp4',
        '[Date a Live IV][02][BIG5][1080P].mp4',
        '[Date a Live IV][03][BIG5][1080P].mp4',
        '[Date a Live IV][04][BIG5][1080P].mp4',
        '[Date a Live IV][05][BIG5][1080P].mp4',
        '[Date a Live IV][06][BIG5][1080P].mp4',
        '[Date a Live IV][07][BIG5][1080P].mp4',
        '[Date a Live IV][08][BIG5][1080P].mp4',
        '[Date a Live IV][09][BIG5][1080P].mp4',
        '[Date a Live IV][10][BIG5][1080P].mp4',
        '[Date a Live IV][11][BIG5][1080P].mp4',
        '[Date a Live IV][12][BIG5][1080P].mp4',
        '[LavaAnime&MingY] Machikado Mazoku S2 [10][1080p][CHS&JPN].mp4',
        '[LavaAnime&MingY] Machikado Mazoku S2 [11][1080p][CHS&JPN].mp4',
        '[LavaAnime&MingY] Machikado Mazoku S2 [12][1080p][CHS&JPN].mp4',
        '[LavaAnime] Machikado Mazoku 2-Choume [01][CHS][1080P][AVC AAC].mp4',
        '[LavaAnime] Machikado Mazoku 2-Choume [02][CHS][1080P][AVC AAC].mp4',
        '[LavaAnime] Machikado Mazoku 2-Choume [03][CHS][1080P][AVC AAC].mp4',
        '[LavaAnime] Machikado Mazoku 2-Choume [04v2][CHS][1080P][AVC AAC].mp4',
        '[LavaAnime] Machikado Mazoku 2-Choume [05][CHS][1080P][AVC AAC].mp4',
        '[LavaAnime] Machikado Mazoku 2-Choume [06v2][CHS][1080P][AVC AAC](LavaAnimeSub).mp4',
        '[LavaAnime] Machikado Mazoku 2-Choume [07][CHS][1080P][AVC AAC](LavaAnimeSub).mp4',
        '[LavaAnime] Machikado Mazoku 2-Choume [08v2][CHS][1080P][AVC AAC](LavaAnimeSub).mp4',
        '[LavaAnime] Machikado Mazoku 2-Choume [09][CHS&JPN][1080P][AVC AAC](LavaAnimeSub).mp4',
        '[FLsnow&SumiSora&LoliHouse] Kaguya-sama wa Kokurasetai S3 - 01 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[FLsnow&SumiSora&LoliHouse] Kaguya-sama wa Kokurasetai S3 - 02 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[FLsnow&SumiSora&LoliHouse] Kaguya-sama wa Kokurasetai S3 - 03 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[FLsnow&SumiSora&LoliHouse] Kaguya-sama wa Kokurasetai S3 - 04 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[FLsnow&SumiSora&LoliHouse] Kaguya-sama wa Kokurasetai S3 - 05 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[FLsnow&SumiSora&LoliHouse] Kaguya-sama wa Kokurasetai S3 - 06 [WebRip 1080p HEVC-10bit AAC ASSx2].mkv',
        '[NC-Raws] Kaguya-sama wa Kokurasetai S3 - 07 (Baha 1920x1080 AVC AAC MP4).mp4',
        '[NC-Raws] 輝夜姬想讓人告白 ー超級浪漫ー - 08 (Baha 1920x1080 AVC AAC MP4).mp4',
        '[NC-Raws] 輝夜姬想讓人告白 ー超級浪漫ー - 09 (Baha 1920x1080 AVC AAC MP4).mp4',
        '[NC-Raws] 輝夜姬想讓人告白 ー超級浪漫ー - 10 (Baha 1920x1080 AVC AAC MP4) [8968F847].mp4',
        '[NC-Raws] 輝夜姬想讓人告白 ー超級浪漫ー - 11 (Baha 1920x1080 AVC AAC MP4) [402860D2].mp4',
        '[NC-Raws] 輝夜姬想讓人告白 ー超級浪漫ー - 12 (Baha 1920x1080 AVC AAC MP4) [1B625365].mp4',
        '[NC-Raws] 輝夜姬想讓人告白 ー超級浪漫ー - 13 (Baha 1920x1080 AVC AAC MP4) [5DAB1557].mp4',
        '[NC-Raws] Kaginado S2 - 13 (Baha 1920x1080 AVC AAC MP4).mp4',
        '[NC-Raws] Kaginado S2 - 14 (Baha 1920x1080 AVC AAC MP4).mp4',
        '[NC-Raws] Kaginado S2 - 15 (Baha 1920x1080 AVC AAC MP4).mp4',
        '[NC-Raws] Kaginado S2 - 16 (Baha 1920x1080 AVC AAC MP4).mp4',
        '[NC-Raws] Kaginado S2 - 17 (Baha 1920x1080 AVC AAC MP4).mp4',
        '[NC-Raws] Kaginado S2 - 18 (Baha 1920x1080 AVC AAC MP4).mp4',
        '[NC-Raws] Kaginado S2 - 19 (Baha 1920x1080 AVC AAC MP4).mp4',
        '[NC-Raws] 鍵等 第二季 - 20 (Baha 1920x1080 AVC AAC MP4).mp4',
        '[NC-Raws] 鍵等 第二季 - 21 (Baha 1920x1080 AVC AAC MP4) [6D0F1152].mp4',
        '[NC-Raws] 鍵等 第二季 - 22 (Baha 1920x1080 AVC AAC MP4) [70748A34].mp4',
        '[NC-Raws] 鍵等 第二季 - 23 (Baha 1920x1080 AVC AAC MP4) [B6E73668].mp4',
        '[Sakurato] Spy x Family [01][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Spy x Family [02][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Spy x Family [03][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Spy x Family [04][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Spy x Family [05][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Spy x Family [06][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Spy x Family [07][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Spy x Family [08][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Spy x Family [09][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Spy x Family [10][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Spy x Family [11][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Spy x Family [12][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Jantama Pong [00][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Jantama Pong [01][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Jantama Pong [02][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Jantama Pong [03][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Jantama Pong [04][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Jantama Pong [05][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Jantama Pong [06][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Jantama Pong [07][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Jantama Pong [08][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Jantama Pong [09][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Jantama Pong [10][AVC-8bit 1080p AAC][CHS].mp4',
        '[Sakurato] Jantama Pong [11][AVC-8bit 1080p AAC][CHS].mp4',
        '[Gaikotsu Kishi-sama][01][BIG5][1080P].mp4',
        '[Gaikotsu Kishi-sama][02][BIG5][1080P].mp4',
        '[Gaikotsu Kishi-sama][03][BIG5][1080P].mp4',
        '[Gaikotsu Kishi-sama][04][BIG5][1080P].mp4',
        '[Gaikotsu Kishi-sama][05][BIG5][1080P].mp4',
        '[Gaikotsu Kishi-sama][06][BIG5][1080P].mp4',
        '[Gaikotsu Kishi-sama][07][BIG5][1080P].mp4',
        '[Gaikotsu Kishi-sama][08][BIG5][1080P].mp4',
        '[Gaikotsu Kishi-sama][09][BIG5][1080P].mp4',
        '[Gaikotsu Kishi-sama][10][BIG5][1080P].mp4',
        '[Gaikotsu Kishi-sama][11][BIG5][1080P].mp4',
        '[Gaikotsu Kishi-sama][12][BIG5][1080P].mp4',
        '[MingY] Onipan! [01][1080p][CHS].mp4',
        '[MingY] Onipan! [02][1080p][CHS].mp4',
        '[MingY] Onipan! [03][1080p][CHS].mp4',
        '[MingY] Onipan! [04][1080p][CHS].mp4',
        '[MingY] Onipan! [05][1080p][CHS].mp4',
        '[MingY] Onipan! [06v2][1080p][CHS].mp4',
        '[MingY] Onipan! [07][1080p][CHS].mp4',
        '[MingY] Onipan! [08][1080p][CHS].mp4',
        '[MingY] Onipan! [09][1080p][CHS].mp4',
        '[MingY] Onipan! [10][1080p][CHS].mp4',
        '[MingY] Onipan! [11][1080p][CHS].mp4',
        '[MingY] Onipan! [12][1080p][CHS].mp4',
        '[SweetSub&EnkanRec] Magia Record Final Season - E01 [WebRip][1080P][AVC 8bit][CHS].mp4',
        '[SweetSub&EnkanRec] Magia Record Final Season - P02 [WebRip][1080P][AVC 8bit][CHS].mp4',
        '[SweetSub&EnkanRec] Magia Record Final Season - EP03 [WebRip][1080P][AVC 8bit][CHS].mp4',
        '[SweetSub&EnkanRec] Magia Record Final Season - 04 [WebRip][1080P][AVC 8bit][CHS].mp4',
        'test.chs.ass',
        'aaaasdwdw',
        'test.mp4.mp4'
    ]
