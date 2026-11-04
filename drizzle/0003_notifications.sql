CREATE TABLE `notifications` (
 `id` text PRIMARY KEY NOT NULL,
 `owner_id` text NOT NULL,
 `recipient_email` text NOT NULL,
 `company_id` text NOT NULL,
 `location_id` text,
 `task_id` text,
 `kind` text NOT NULL,
 `title` text NOT NULL,
 `body` text NOT NULL,
 `created_at` text NOT NULL,
 `read_at` text
);
--> statement-breakpoint
CREATE INDEX `notifications_recipient_time` ON `notifications` (`owner_id`,`recipient_email`,`created_at`);
--> statement-breakpoint
CREATE INDEX `notifications_recipient_unread` ON `notifications` (`owner_id`,`recipient_email`,`read_at`);
