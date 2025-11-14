CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(128) NOT NULL,
	`resourceType` varchar(64) NOT NULL,
	`resourceId` int,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `betVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` varchar(128) NOT NULL,
	`matchId` int,
	`topicType` enum('bet','vote') NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`options` json NOT NULL,
	`voterAnonId` varchar(128) NOT NULL,
	`choice` varchar(128) NOT NULL,
	`createdTs` timestamp NOT NULL DEFAULT (now()),
	`revealedTs` timestamp,
	`moderationFlag` boolean DEFAULT false,
	`metadata` json,
	CONSTRAINT `betVotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `combos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`members` json NOT NULL,
	`context` varchar(128),
	`attempts` int NOT NULL DEFAULT 0,
	`successes` int NOT NULL DEFAULT 0,
	`winRate` float,
	`confidenceIntervalLow` float,
	`confidenceIntervalHigh` float,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `combos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`consentType` varchar(64) NOT NULL,
	`granted` boolean NOT NULL,
	`grantedAt` timestamp,
	`revokedAt` timestamp,
	`expiresAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataRetention` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`retentionDays` int NOT NULL DEFAULT 30,
	`deleteAt` timestamp NOT NULL,
	`frozen` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataRetention_id` PRIMARY KEY(`id`),
	CONSTRAINT `dataRetention_matchId_unique` UNIQUE(`matchId`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`eventTs` timestamp NOT NULL,
	`actor` varchar(128) NOT NULL,
	`action` varchar(64) NOT NULL,
	`target` varchar(128),
	`positionX` float,
	`positionY` float,
	`positionZ` float,
	`ability` varchar(64),
	`success` boolean,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` varchar(128) NOT NULL,
	`game` varchar(64) NOT NULL,
	`map` varchar(64) NOT NULL,
	`teamIds` json NOT NULL,
	`startTs` timestamp NOT NULL,
	`endTs` timestamp NOT NULL,
	`userId` int NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`),
	CONSTRAINT `matches_matchId_unique` UNIQUE(`matchId`)
);
--> statement-breakpoint
CREATE TABLE `phases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phaseId` varchar(128) NOT NULL,
	`matchId` int NOT NULL,
	`phaseType` enum('hot','normal','slump','recovery') NOT NULL,
	`startTs` timestamp NOT NULL,
	`endTs` timestamp NOT NULL,
	`changePointScore` float,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `phases_id` PRIMARY KEY(`id`),
	CONSTRAINT `phases_phaseId_unique` UNIQUE(`phaseId`)
);
--> statement-breakpoint
CREATE TABLE `processingTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` varchar(128) NOT NULL,
	`matchId` int NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`progress` int DEFAULT 0,
	`eta` timestamp,
	`errors` json,
	`result` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `processingTasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `processingTasks_taskId_unique` UNIQUE(`taskId`)
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` varchar(128) NOT NULL,
	`matchId` int,
	`topicType` enum('bet','vote') NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`options` json NOT NULL,
	`revealAt` timestamp,
	`status` enum('active','closed','revealed') NOT NULL DEFAULT 'active',
	`createdBy` int NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `topics_id` PRIMARY KEY(`id`),
	CONSTRAINT `topics_topicId_unique` UNIQUE(`topicId`)
);
--> statement-breakpoint
CREATE TABLE `ttdSamples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`phaseId` int,
	`eventSrcTs` timestamp NOT NULL,
	`decisionTs` timestamp NOT NULL,
	`actionTs` timestamp NOT NULL,
	`ttdMs` int NOT NULL,
	`contextHash` varchar(128),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ttdSamples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`badges` json,
	`streak` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPoints_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPoints_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `voiceTurns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`speakerId` varchar(128) NOT NULL,
	`startTs` timestamp NOT NULL,
	`endTs` timestamp NOT NULL,
	`text` text,
	`clarity` float,
	`infoDensity` float,
	`interruption` boolean DEFAULT false,
	`sentiment` varchar(32),
	`sentimentScore` float,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voiceTurns_id` PRIMARY KEY(`id`)
);
