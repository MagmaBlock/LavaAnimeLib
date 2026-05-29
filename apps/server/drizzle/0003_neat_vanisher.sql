ALTER TABLE `drive_endpoints` ADD `banNSFW` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `drive_endpoints` ADD `disableDownload` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `drive_endpoints` e
JOIN `drives` d ON d.id = e.drive_id
SET e.banNSFW = d.banNSFW, e.disableDownload = d.disableDownload;--> statement-breakpoint
ALTER TABLE `drives` DROP COLUMN `banNSFW`;--> statement-breakpoint
ALTER TABLE `drives` DROP COLUMN `disableDownload`;