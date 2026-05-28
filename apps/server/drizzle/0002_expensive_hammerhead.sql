CREATE TABLE `connection_configs` (
	`id` int NOT NULL AUTO_INCREMENT,
	`type` varchar(32) NOT NULL,
	`config` json NOT NULL,
	CONSTRAINT `connection_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drive_endpoints` (
	`id` int NOT NULL AUTO_INCREMENT,
	`drive_id` varchar(100) NOT NULL,
	`name` varchar(100) NOT NULL,
	`url` varchar(512) NOT NULL DEFAULT '',
	`connection_config_id` int NOT NULL,
	`priority` int NOT NULL DEFAULT 0,
	`enabled` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `drive_endpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_index` (
	`id` int NOT NULL AUTO_INCREMENT,
	`drive_id` varchar(100) NOT NULL,
	`anime_id` int,
	`path` varchar(1024) NOT NULL,
	`name` varchar(512) NOT NULL,
	`size` bigint NOT NULL DEFAULT 0,
	`type` varchar(4) NOT NULL,
	`deleted` tinyint NOT NULL DEFAULT 0,
	`modified` timestamp,
	`sign` varchar(512),
	`indexed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_index_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `file_index` ADD UNIQUE INDEX `uk_drive_path` (`drive_id`,`path`);
--> statement-breakpoint
ALTER TABLE `file_index` ADD INDEX `idx_anime_id` (`anime_id`);
--> statement-breakpoint
ALTER TABLE `file_index` ADD INDEX `idx_drive_type` (`drive_id`,`type`);
--> statement-breakpoint
ALTER TABLE `file_index` ADD INDEX `idx_deleted_indexed` (`deleted`,`indexed_at`);
--> statement-breakpoint
ALTER TABLE `drives` ADD `connection_config_id` int;
--> statement-breakpoint
ALTER TABLE `drives` DROP COLUMN `type`;
--> statement-breakpoint
ALTER TABLE `drives` DROP COLUMN `host`;
--> statement-breakpoint
ALTER TABLE `drives` DROP COLUMN `path`;
--> statement-breakpoint
ALTER TABLE `drives` DROP COLUMN `password`;
