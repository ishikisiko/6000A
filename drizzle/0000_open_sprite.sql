CREATE TABLE `auditLogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`action` text NOT NULL,
	`resourceType` text NOT NULL,
	`resourceId` integer,
	`details` text,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `betVotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topicId` text NOT NULL,
	`matchId` integer,
	`topicType` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`options` text NOT NULL,
	`voterAnonId` text NOT NULL,
	`choice` text NOT NULL,
	`createdTs` integer DEFAULT (unixepoch()) NOT NULL,
	`revealedTs` integer,
	`moderationFlag` integer DEFAULT false,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `combos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`matchId` integer NOT NULL,
	`members` text NOT NULL,
	`context` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`successes` integer DEFAULT 0 NOT NULL,
	`winRate` real,
	`confidenceIntervalLow` real,
	`confidenceIntervalHigh` real,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `consents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`consentType` text NOT NULL,
	`granted` integer NOT NULL,
	`grantedAt` integer,
	`revokedAt` integer,
	`expiresAt` integer,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dataRetention` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`matchId` integer NOT NULL,
	`retentionDays` integer DEFAULT 30 NOT NULL,
	`deleteAt` integer NOT NULL,
	`frozen` integer DEFAULT false,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dataRetention_matchId_unique` ON `dataRetention` (`matchId`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`matchId` integer NOT NULL,
	`eventTs` integer NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text,
	`positionX` real,
	`positionY` real,
	`positionZ` real,
	`ability` text,
	`success` integer,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`matchId` text NOT NULL,
	`game` text NOT NULL,
	`map` text NOT NULL,
	`teamIds` text NOT NULL,
	`startTs` integer NOT NULL,
	`endTs` integer NOT NULL,
	`userId` integer NOT NULL,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matches_matchId_unique` ON `matches` (`matchId`);--> statement-breakpoint
CREATE TABLE `phases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phaseId` text NOT NULL,
	`matchId` integer NOT NULL,
	`phaseType` text NOT NULL,
	`startTs` integer NOT NULL,
	`endTs` integer NOT NULL,
	`changePointScore` real,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `phases_phaseId_unique` ON `phases` (`phaseId`);--> statement-breakpoint
CREATE TABLE `processingTasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`taskId` text NOT NULL,
	`matchId` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`progress` integer DEFAULT 0,
	`eta` integer,
	`errors` text,
	`result` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `processingTasks_taskId_unique` ON `processingTasks` (`taskId`);--> statement-breakpoint
CREATE TABLE `topics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topicId` text NOT NULL,
	`matchId` integer,
	`topicType` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`options` text NOT NULL,
	`revealAt` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`createdBy` integer NOT NULL,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `topics_topicId_unique` ON `topics` (`topicId`);--> statement-breakpoint
CREATE TABLE `ttdSamples` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`matchId` integer NOT NULL,
	`phaseId` integer,
	`eventSrcTs` integer NOT NULL,
	`decisionTs` integer NOT NULL,
	`actionTs` integer NOT NULL,
	`ttdMs` integer NOT NULL,
	`contextHash` text,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `userPoints` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`badges` text,
	`streak` integer DEFAULT 0 NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `userPoints_userId_unique` ON `userPoints` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastSignedIn` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE TABLE `voiceTurns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`matchId` integer NOT NULL,
	`speakerId` text NOT NULL,
	`startTs` integer NOT NULL,
	`endTs` integer NOT NULL,
	`text` text,
	`clarity` real,
	`infoDensity` real,
	`interruption` integer DEFAULT false,
	`sentiment` text,
	`sentimentScore` real,
	`metadata` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
