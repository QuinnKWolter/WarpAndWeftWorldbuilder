CREATE TABLE `state_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`property_key` text NOT NULL,
	`target_id` text,
	`previous_value` text,
	`new_value` text NOT NULL,
	`story_time` real NOT NULL,
	`change_order` real NOT NULL,
	`unit_id` text,
	`event_id` text,
	`note` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `narrative_units`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `changes_subject_time_idx` ON `state_changes` (`project_id`,`subject_id`,`story_time`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`content` text NOT NULL,
	`plain_text` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `narrative_units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_unit_id_unique` ON `documents` (`unit_id`);--> statement-breakpoint
CREATE TABLE `entities` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`unresolved` integer NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `objects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `entities_project_idx` ON `entities` (`project_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`unit_id` text,
	`story_time` real NOT NULL,
	`event_order` real NOT NULL,
	`requirements` text NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `objects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `narrative_units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `entity_facets` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `view_layouts` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`lens` text NOT NULL,
	`object_id` text NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `semantic_links` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`source_id` text NOT NULL,
	`target_id` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `objects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_id`) REFERENCES `objects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scene_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`entity_id` text NOT NULL,
	`role` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `narrative_units`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `entity_references` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`document_id` text NOT NULL,
	`entity_id` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `objects` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`kind` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `objects_project_idx` ON `objects` (`project_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`settings` text NOT NULL,
	`owner_id` text DEFAULT 'local' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `relationship_states` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`relationship_id` text NOT NULL,
	`valid_from` real NOT NULL,
	`valid_until` real,
	`label` text NOT NULL,
	`dimensions` text NOT NULL,
	`unit_id` text,
	`event_id` text,
	`note` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`relationship_id`) REFERENCES `relationships`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `narrative_units`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `relationship_states_time_idx` ON `relationship_states` (`relationship_id`,`valid_from`);--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`source_id` text NOT NULL,
	`target_id` text NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`directed` integer NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `objects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `thread_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`thread_id` text NOT NULL,
	`object_id` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`thread_id`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`color` text NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `objects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `narrative_units` (
	`id` text PRIMARY KEY NOT NULL,
	`metadata` text NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`parent_id` text,
	`rank` real NOT NULL,
	`story_time` real,
	`story_end` real,
	`time_label` text NOT NULL,
	`synopsis` text NOT NULL,
	`pov_id` text,
	`status` text NOT NULL,
	`unresolved` integer NOT NULL,
	`unplaced` integer NOT NULL,
	`setup` integer NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `objects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `narrative_units`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pov_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `units_project_parent_rank_idx` ON `narrative_units` (`project_id`,`parent_id`,`rank`);--> statement-breakpoint
CREATE INDEX `units_story_time_idx` ON `narrative_units` (`project_id`,`story_time`);