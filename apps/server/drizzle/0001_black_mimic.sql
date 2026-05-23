CREATE TABLE `drives` (
	`id` varchar(100) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`type` varchar(32) NOT NULL DEFAULT 'alist',
	`host` varchar(512) NOT NULL,
	`path` varchar(512) NOT NULL,
	`password` varchar(512) NOT NULL DEFAULT '',
	`banNSFW` tinyint NOT NULL DEFAULT 0,
	`disableDownload` tinyint NOT NULL DEFAULT 0,
	`enabled` tinyint NOT NULL DEFAULT 1,
	`isDefault` tinyint NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drives_id` PRIMARY KEY(`id`)
);
