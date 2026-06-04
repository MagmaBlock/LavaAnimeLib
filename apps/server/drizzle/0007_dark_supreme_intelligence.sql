CREATE TABLE `character_persons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`character_id` int NOT NULL,
	`person_id` int NOT NULL,
	CONSTRAINT `character_persons_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_char_person` UNIQUE(`character_id`,`person_id`)
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`name_cn` varchar(255),
	`type` tinyint,
	`summary` longtext,
	`image_large` varchar(1024),
	`image_medium` varchar(1024),
	`image_small` varchar(1024),
	`image_grid` varchar(1024),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `characters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `person_careers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`person_id` int NOT NULL,
	`career` varchar(128) NOT NULL,
	CONSTRAINT `person_careers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persons` (
	`id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` tinyint,
	`short_summary` longtext,
	`locked` tinyint NOT NULL DEFAULT 0,
	`image_large` varchar(1024),
	`image_medium` varchar(1024),
	`image_small` varchar(1024),
	`image_grid` varchar(1024),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `persons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subject_aliases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject_id` int NOT NULL,
	`alias` varchar(512) NOT NULL,
	CONSTRAINT `subject_aliases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subject_characters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject_id` int NOT NULL,
	`character_id` int NOT NULL,
	`relation` varchar(128),
	CONSTRAINT `subject_characters_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_subject_char` UNIQUE(`subject_id`,`character_id`)
);
--> statement-breakpoint
CREATE TABLE `subject_episodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject_id` int NOT NULL,
	`bgm_ep_id` int,
	`type` tinyint NOT NULL DEFAULT 0,
	`sort` decimal(5,1) NOT NULL,
	`ep` int,
	`name` varchar(512),
	`name_cn` varchar(512),
	`airdate` varchar(32),
	`duration` varchar(32),
	`desc` longtext,
	`status` varchar(32),
	CONSTRAINT `subject_episodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `subject_episodes_bgm_ep_id_unique` UNIQUE(`bgm_ep_id`)
);
--> statement-breakpoint
CREATE TABLE `subject_infobox` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject_id` int NOT NULL,
	`key` varchar(128) NOT NULL,
	`sub_key` varchar(255),
	`value` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `subject_infobox_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subject_meta_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject_id` int NOT NULL,
	`tag` varchar(128) NOT NULL,
	CONSTRAINT `subject_meta_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subject_rating_counts` (
	`subject_id` int NOT NULL,
	`star` tinyint NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	CONSTRAINT `subject_rating_counts_subject_id_star_pk` PRIMARY KEY(`subject_id`,`star`)
);
--> statement-breakpoint
CREATE TABLE `subject_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject_id` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	CONSTRAINT `subject_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_subject_tag` UNIQUE(`subject_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bgmid` int NOT NULL,
	`type` tinyint NOT NULL DEFAULT 2,
	`name` varchar(512) NOT NULL,
	`name_cn` varchar(512),
	`summary` longtext,
	`nsfw` tinyint NOT NULL DEFAULT 0,
	`locked` tinyint NOT NULL DEFAULT 0,
	`platform` varchar(64),
	`air_date` varchar(32),
	`series` tinyint NOT NULL DEFAULT 0,
	`volumes` int NOT NULL DEFAULT 0,
	`eps` int NOT NULL DEFAULT 0,
	`total_episodes` int NOT NULL DEFAULT 0,
	`rating_score` decimal(3,1),
	`rating_rank` int,
	`rating_total` int,
	`collect_wish` int NOT NULL DEFAULT 0,
	`collect_collect` int NOT NULL DEFAULT 0,
	`collect_doing` int NOT NULL DEFAULT 0,
	`collect_on_hold` int NOT NULL DEFAULT 0,
	`collect_dropped` int NOT NULL DEFAULT 0,
	`image_large` varchar(1024),
	`image_common` varchar(1024),
	`image_medium` varchar(1024),
	`image_small` varchar(1024),
	`image_grid` varchar(1024),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_bgmid_unique` UNIQUE(`bgmid`)
);
--> statement-breakpoint
ALTER TABLE `character_persons` ADD CONSTRAINT `character_persons_character_id_characters_id_fk` FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_persons` ADD CONSTRAINT `character_persons_person_id_persons_id_fk` FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `person_careers` ADD CONSTRAINT `person_careers_person_id_persons_id_fk` FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_aliases` ADD CONSTRAINT `subject_aliases_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_characters` ADD CONSTRAINT `subject_characters_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_characters` ADD CONSTRAINT `subject_characters_character_id_characters_id_fk` FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_episodes` ADD CONSTRAINT `subject_episodes_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_infobox` ADD CONSTRAINT `subject_infobox_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_meta_tags` ADD CONSTRAINT `subject_meta_tags_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_rating_counts` ADD CONSTRAINT `subject_rating_counts_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_tags` ADD CONSTRAINT `subject_tags_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_char_name` ON `characters` (`name`);--> statement-breakpoint
CREATE INDEX `idx_person_name` ON `persons` (`name`);--> statement-breakpoint
CREATE INDEX `idx_alias` ON `subject_aliases` (`alias`);--> statement-breakpoint
CREATE INDEX `idx_subject` ON `subject_aliases` (`subject_id`);--> statement-breakpoint
CREATE INDEX `idx_subject_sort` ON `subject_episodes` (`subject_id`,`sort`);--> statement-breakpoint
CREATE INDEX `idx_subject_key` ON `subject_infobox` (`subject_id`,`key`);--> statement-breakpoint
CREATE INDEX `idx_subject` ON `subject_meta_tags` (`subject_id`);--> statement-breakpoint
CREATE INDEX `idx_bgmid` ON `subjects` (`bgmid`);--> statement-breakpoint
CREATE INDEX `idx_rating` ON `subjects` (`rating_score`);--> statement-breakpoint
CREATE INDEX `idx_name_cn` ON `subjects` (`name_cn`);--> statement-breakpoint
CREATE INDEX `idx_air_date` ON `subjects` (`air_date`);--> statement-breakpoint
CREATE INDEX `idx_nsfw` ON `subjects` (`nsfw`);