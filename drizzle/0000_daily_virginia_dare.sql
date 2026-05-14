CREATE TABLE IF NOT EXISTS `anime` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`views` int NOT NULL DEFAULT 0,
	`bgmid` text,
	`nsfw` tinyint NOT NULL DEFAULT 0,
	`title` text,
	`deleted` tinyint NOT NULL DEFAULT 0,
	`poster` text,
	CONSTRAINT `anime_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `bangumi_data` (
	`bgmid` int NOT NULL,
	`relations_anime` longtext,
	`subjects` longtext,
	`characters` longtext,
	`update_time` timestamp DEFAULT (now()),
	CONSTRAINT `bangumi_data_bgmid` PRIMARY KEY(`bgmid`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `follow` (
	`user_id` int NOT NULL,
	`anime_id` int NOT NULL,
	`status` int NOT NULL,
	`edit_time` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `follow_user_id_anime_id_pk` PRIMARY KEY(`user_id`,`anime_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `invite_code` (
	`code` varchar(100) NOT NULL,
	`code_user` int,
	`code_creator` int,
	`create_time` timestamp DEFAULT (now()),
	`use_time` timestamp,
	`expiration_time` timestamp,
	CONSTRAINT `invite_code_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `settings` (
	`key` varchar(100) NOT NULL,
	`value` text,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `token` (
	`token` varchar(256) NOT NULL,
	`user` int NOT NULL,
	`create_time` timestamp NOT NULL DEFAULT (now()),
	`expiration_time` timestamp NOT NULL DEFAULT (now()),
	`status` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `token_token` PRIMARY KEY(`token`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `upload_message` (
	`id` int AUTO_INCREMENT NOT NULL,
	`index` text NOT NULL,
	`animeID` int,
	`bangumiID` int,
	`fileName` text,
	`messageSentStatus` tinyint NOT NULL DEFAULT 0,
	`uploadTime` datetime(3) DEFAULT current_timestamp(3),
	`messageSkiped` tinyint NOT NULL DEFAULT 0,
	CONSTRAINT `upload_message_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(100) NOT NULL,
	`name` varchar(100) NOT NULL,
	`password` varchar(255) NOT NULL,
	`create_time` timestamp DEFAULT (now()),
	`data` varchar(2048),
	`settings` varchar(2048),
	CONSTRAINT `user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `view_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userID` int NOT NULL,
	`animeID` int NOT NULL,
	`fileName` varchar(255),
	`episode` varchar(16),
	`currentTime` int,
	`totalTime` int,
	`userIP` varchar(64),
	`watchMethod` varchar(32),
	`lastReportTime` datetime(0) DEFAULT current_timestamp,
	`useDrive` varchar(64),
	CONSTRAINT `view_history_id` PRIMARY KEY(`id`),
	CONSTRAINT `view_history_un` UNIQUE(`userID`,`animeID`,`fileName`,`watchMethod`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ep` text,
	`file` text,
	`ip` text,
	`user` int,
	`time` timestamp DEFAULT (now()),
	`type` text NOT NULL,
	CONSTRAINT `views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `upload_message` ADD CONSTRAINT `upload_message_animeID_anime_id_fk` FOREIGN KEY (`animeID`) REFERENCES `anime`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `upload_message` ADD CONSTRAINT `upload_message_bangumiID_bangumi_data_bgmid_fk` FOREIGN KEY (`bangumiID`) REFERENCES `bangumi_data`(`bgmid`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `upload_message_animeID_fkey` ON `upload_message` (`animeID`);--> statement-breakpoint
CREATE INDEX `upload_message_bangumiID_fkey` ON `upload_message` (`bangumiID`);--> statement-breakpoint
CREATE INDEX `view_history_userID_IDX` ON `view_history` (`userID`,`animeID`);