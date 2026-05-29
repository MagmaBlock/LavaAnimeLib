ALTER TABLE `drive_endpoints` MODIFY COLUMN `url` varchar(512) NOT NULL;
UPDATE `drive_endpoints` SET `enabled` = 0 WHERE `url` = "";
