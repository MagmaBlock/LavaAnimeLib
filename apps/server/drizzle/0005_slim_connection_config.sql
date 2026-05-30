ALTER TABLE `drives` ADD COLUMN `type` varchar(32);--> statement-breakpoint
ALTER TABLE `drives` ADD COLUMN `config` json;--> statement-breakpoint
ALTER TABLE `drives` ADD COLUMN `banNSFW` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
UPDATE `drives` d
JOIN `connection_configs` c ON d.`connection_config_id` = c.`id`
SET d.`type` = c.`type`, d.`config` = c.`config`;--> statement-breakpoint
UPDATE `drives` SET `type` = 'alist' WHERE `type` IS NULL;--> statement-breakpoint
UPDATE `drives` SET `config` = JSON_OBJECT('host', '', 'path', '', 'password', '') WHERE `config` IS NULL;--> statement-breakpoint
ALTER TABLE `drives` MODIFY COLUMN `type` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `drives` MODIFY COLUMN `config` json NOT NULL;--> statement-breakpoint
ALTER TABLE `drives` DROP COLUMN `connection_config_id`;--> statement-breakpoint
ALTER TABLE `drive_endpoints` ADD COLUMN `config_override` json NULL;--> statement-breakpoint
UPDATE `drive_endpoints` de
JOIN `connection_configs` c ON de.`connection_config_id` = c.`id`
SET de.`config_override` = JSON_OBJECT('host', de.`url`);--> statement-breakpoint
UPDATE `drive_endpoints` de
JOIN `drives` d ON de.`drive_id` = d.`id`
SET de.`config_override` = NULL
WHERE JSON_UNQUOTE(JSON_EXTRACT(de.`config_override`, '$.host')) = JSON_UNQUOTE(JSON_EXTRACT(d.`config`, '$.host'));--> statement-breakpoint
ALTER TABLE `drive_endpoints` DROP COLUMN `connection_config_id`;--> statement-breakpoint
ALTER TABLE `drive_endpoints` DROP COLUMN `url`;--> statement-breakpoint
DROP TABLE `connection_configs`;
