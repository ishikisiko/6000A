CREATE TABLE `teamMembers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teamId` integer NOT NULL,
	`userId` integer NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`nickname` text,
	`position` text,
	`status` text DEFAULT 'offline',
	`lastActiveAt` integer,
	`joinedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teamMembers_team_user_unique` ON `teamMembers` (`teamId`,`userId`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teamId` text NOT NULL,
	`name` text NOT NULL,
	`tag` text,
	`description` text,
	`avatar` text,
	`ownerId` integer NOT NULL,
	`inviteCode` text,
	`maxMembers` integer DEFAULT 5 NOT NULL,
	`isPublic` integer DEFAULT false,
	`settings` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_teamId_unique` ON `teams` (`teamId`);--> statement-breakpoint
CREATE UNIQUE INDEX `teams_inviteCode_unique` ON `teams` (`inviteCode`);