CREATE TABLE `customer_messages` (
 `id` text PRIMARY KEY NOT NULL,
 `owner_id` text NOT NULL,
 `company_id` text NOT NULL,
 `task_id` text,
 `author_id` text NOT NULL,
 `author_name` text NOT NULL,
 `author_role` text NOT NULL,
 `body` text NOT NULL,
 `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customer_messages_tenant_time` ON `customer_messages` (`owner_id`,`company_id`,`created_at`);
