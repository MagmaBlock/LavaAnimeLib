ALTER TABLE `drives` ADD `last_scan_at` timestamp;--> statement-breakpoint
ALTER TABLE `drives` ADD `last_scan_ok` tinyint;--> statement-breakpoint
ALTER TABLE `drives` ADD `last_scan_rows` int;--> statement-breakpoint
ALTER TABLE `drives` ADD `last_scan_error` text;