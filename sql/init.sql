-- lavaanimelibserverv2.anime definition
CREATE TABLE IF NOT EXISTS `anime` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '文件夹ID',
  `year` text NOT NULL COMMENT '年',
  `type` text NOT NULL COMMENT '月',
  `name` text NOT NULL COMMENT '文件夹名称',
  `views` int(11) NOT NULL DEFAULT 0 COMMENT '播放量',
  `bgmid` text DEFAULT NULL COMMENT 'Bangumi ID',
  `nsfw` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'NSFW',
  `title` text DEFAULT NULL COMMENT '番剧名',
  `deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除',
  `poster` text DEFAULT NULL COMMENT '海报图片地址',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- lavaanimelibserverv2.bangumi_data definition
CREATE TABLE IF NOT EXISTS `bangumi_data` (
  `bgmid` int(11) NOT NULL,
  `relations_anime` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `subjects` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `characters` longtext DEFAULT NULL,
  `update_time` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`bgmid`),
  UNIQUE KEY `bangumi_data_un` (`bgmid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- lavaanimelibserverv2.follow definition
CREATE TABLE IF NOT EXISTS `follow` (
  `user_id` int(11) NOT NULL,
  `anime_id` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  `edit_time` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`, `anime_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- lavaanimelibserverv2.invite_code definition
CREATE TABLE IF NOT EXISTS `invite_code` (
  `code` varchar(100) NOT NULL,
  `code_user` int(11) DEFAULT NULL,
  `code_creator` int(11) DEFAULT NULL,
  `create_time` timestamp NULL DEFAULT current_timestamp(),
  `use_time` timestamp NULL DEFAULT NULL,
  `expiration_time` timestamp NULL DEFAULT NULL,
  UNIQUE KEY `invite_code_un` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- lavaanimelibserverv2.settings definition
CREATE TABLE IF NOT EXISTS `settings` (
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  UNIQUE KEY `settings_un` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- lavaanimelibserverv2.token definition
CREATE TABLE IF NOT EXISTS `token` (
  `token` varchar(256) NOT NULL,
  `user` int(11) NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `expiration_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` tinyint(1) NOT NULL DEFAULT 1,
  UNIQUE KEY `token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- lavaanimelibserverv2.`user` definition
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `create_time` timestamp NULL DEFAULT current_timestamp(),
  `data` varchar(2048) DEFAULT NULL,
  `settings` varchar(2048) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- lavaanimelibserverv2.view_history definition
CREATE TABLE IF NOT EXISTS `view_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL COMMENT '用户的 ID',
  `animeID` int(11) NOT NULL COMMENT '动画的 ID',
  `fileName` varchar(255) DEFAULT NULL COMMENT '播放视频的名称（读操作时，可解析信息）',
  `episode` varchar(16) DEFAULT NULL COMMENT '播放视频的集数',
  `currentTime` int(11) DEFAULT NULL COMMENT '播放视频的当前进度（如果有）',
  `totalTime` int(11) DEFAULT NULL COMMENT '播放视频的总长度（如果有）',
  `userIP` varchar(64) DEFAULT NULL COMMENT '用户的播放 IP',
  `watchMethod` varchar(32) DEFAULT NULL COMMENT '用户播放方式',
  `lastReportTime` datetime DEFAULT current_timestamp() COMMENT '最后一次上报观看的时间',
  `useDrive` varchar(64) DEFAULT NULL COMMENT '播放时的节点',
  PRIMARY KEY (`id`),
  UNIQUE KEY `view_history_un` (`userID`, `animeID`, `fileName`, `watchMethod`),
  KEY `view_history_userID_IDX` (`userID`, `animeID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- lavaanimelibserverv2.views definition
CREATE TABLE IF NOT EXISTS `views` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ep` text DEFAULT NULL,
  `file` text DEFAULT NULL,
  `ip` text DEFAULT NULL,
  `user` int(11) DEFAULT NULL,
  `time` timestamp NULL DEFAULT current_timestamp(),
  `type` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- lavaanimelibserverv2.upload_message definition
CREATE TABLE IF NOT EXISTS `upload_message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `index` text NOT NULL,
  `animeID` int(11) DEFAULT NULL,
  `bangumiID` int(11) DEFAULT NULL,
  `fileName` text DEFAULT NULL,
  `messageSentStatus` tinyint(1) NOT NULL DEFAULT 0,
  `uploadTime` datetime(3) DEFAULT current_timestamp(3),
  `messageSkiped` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `upload_message_animeID_fkey` (`animeID`),
  KEY `upload_message_bangumiID_fkey` (`bangumiID`),
  CONSTRAINT `upload_message_animeID_fkey` FOREIGN KEY (`animeID`) REFERENCES `anime` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `upload_message_bangumiID_fkey` FOREIGN KEY (`bangumiID`) REFERENCES `bangumi_data` (`bgmid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
