import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, float, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Match table - stores information about each game match
 */
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  matchId: varchar("matchId", { length: 128 }).notNull().unique(),
  game: varchar("game", { length: 64 }).notNull(), // e.g., "Valorant", "CS2"
  map: varchar("map", { length: 64 }).notNull(),
  teamIds: json("teamIds").$type<string[]>().notNull(), // Array of team IDs
  startTs: timestamp("startTs").notNull(),
  endTs: timestamp("endTs").notNull(),
  userId: int("userId").notNull(), // Owner of this match data
  metadata: json("metadata").$type<Record<string, any>>(), // Additional match metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

/**
 * Phase table - stores phase segmentation within a match
 * Phase types: hot (热手), normal (正常), slump (低迷), recovery (恢复)
 */
export const phases = mysqlTable("phases", {
  id: int("id").autoincrement().primaryKey(),
  phaseId: varchar("phaseId", { length: 128 }).notNull().unique(),
  matchId: int("matchId").notNull(),
  phaseType: mysqlEnum("phaseType", ["hot", "normal", "slump", "recovery"]).notNull(),
  startTs: timestamp("startTs").notNull(),
  endTs: timestamp("endTs").notNull(),
  changePointScore: float("changePointScore"), // Confidence score of the change point
  metadata: json("metadata").$type<Record<string, any>>(), // Additional phase metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Phase = typeof phases.$inferSelect;
export type InsertPhase = typeof phases.$inferInsert;

/**
 * Event table - stores in-game events
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  eventTs: timestamp("eventTs").notNull(),
  actor: varchar("actor", { length: 128 }).notNull(), // Player ID or name
  action: varchar("action", { length: 64 }).notNull(), // e.g., "kill", "death", "plant_bomb"
  target: varchar("target", { length: 128 }), // Target player or object
  positionX: float("positionX"),
  positionY: float("positionY"),
  positionZ: float("positionZ"),
  ability: varchar("ability", { length: 64 }), // Ability or weapon used
  success: boolean("success"), // Whether the action was successful
  metadata: json("metadata").$type<Record<string, any>>(), // Additional event data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * TTD Sample table - stores Time-to-Decision samples
 */
export const ttdSamples = mysqlTable("ttdSamples", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  phaseId: int("phaseId"),
  eventSrcTs: timestamp("eventSrcTs").notNull(), // Trigger event timestamp
  decisionTs: timestamp("decisionTs").notNull(), // Decision made timestamp
  actionTs: timestamp("actionTs").notNull(), // Action executed timestamp
  ttdMs: int("ttdMs").notNull(), // Time-to-decision in milliseconds
  contextHash: varchar("contextHash", { length: 128 }), // Hash of the context
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TTDSample = typeof ttdSamples.$inferSelect;
export type InsertTTDSample = typeof ttdSamples.$inferInsert;

/**
 * Voice Turn table - stores voice communication analysis
 */
export const voiceTurns = mysqlTable("voiceTurns", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  speakerId: varchar("speakerId", { length: 128 }).notNull(),
  startTs: timestamp("startTs").notNull(),
  endTs: timestamp("endTs").notNull(),
  text: text("text"), // Transcribed text
  clarity: float("clarity"), // Speech clarity score (0-1)
  infoDensity: float("infoDensity"), // Information density score
  interruption: boolean("interruption").default(false), // Whether this was an interruption
  sentiment: varchar("sentiment", { length: 32 }), // e.g., "positive", "negative", "neutral"
  sentimentScore: float("sentimentScore"), // Sentiment score (-1 to 1)
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VoiceTurn = typeof voiceTurns.$inferSelect;
export type InsertVoiceTurn = typeof voiceTurns.$inferInsert;

/**
 * Duo/Trio Combo table - stores team collaboration metrics
 */
export const combos = mysqlTable("combos", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  members: json("members").$type<string[]>().notNull(), // Array of player IDs
  context: varchar("context", { length: 128 }), // e.g., "A_site", "mid_control"
  attempts: int("attempts").notNull().default(0),
  successes: int("successes").notNull().default(0),
  winRate: float("winRate"), // Success rate
  confidenceIntervalLow: float("confidenceIntervalLow"), // CI lower bound
  confidenceIntervalHigh: float("confidenceIntervalHigh"), // CI upper bound
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Combo = typeof combos.$inferSelect;
export type InsertCombo = typeof combos.$inferInsert;

/**
 * Bet/Vote table - stores fun betting and anonymous voting
 */
export const betVotes = mysqlTable("betVotes", {
  id: int("id").autoincrement().primaryKey(),
  topicId: varchar("topicId", { length: 128 }).notNull(),
  matchId: int("matchId"),
  topicType: mysqlEnum("topicType", ["bet", "vote"]).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  options: json("options").$type<string[]>().notNull(), // Array of options
  voterAnonId: varchar("voterAnonId", { length: 128 }).notNull(), // Anonymized voter ID
  choice: varchar("choice", { length: 128 }).notNull(), // Selected option
  createdTs: timestamp("createdTs").defaultNow().notNull(),
  revealedTs: timestamp("revealedTs"), // When results were revealed
  moderationFlag: boolean("moderationFlag").default(false), // Flagged for moderation
  metadata: json("metadata").$type<Record<string, any>>(),
});

export type BetVote = typeof betVotes.$inferSelect;
export type InsertBetVote = typeof betVotes.$inferInsert;

/**
 * Topic table - stores bet/vote topics
 */
export const topics = mysqlTable("topics", {
  id: int("id").autoincrement().primaryKey(),
  topicId: varchar("topicId", { length: 128 }).notNull().unique(),
  matchId: int("matchId"),
  topicType: mysqlEnum("topicType", ["bet", "vote"]).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  options: json("options").$type<string[]>().notNull(),
  revealAt: timestamp("revealAt"), // Scheduled reveal time
  status: mysqlEnum("status", ["active", "closed", "revealed"]).default("active").notNull(),
  createdBy: int("createdBy").notNull(), // User ID
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = typeof topics.$inferInsert;

/**
 * User Points table - stores user points and badges
 */
export const userPoints = mysqlTable("userPoints", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  points: int("points").notNull().default(0),
  badges: json("badges").$type<string[]>(), // Array of badge IDs
  streak: int("streak").notNull().default(0), // Consecutive participation streak
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = typeof userPoints.$inferInsert;

/**
 * Consent table - stores user consent for data processing
 */
export const consents = mysqlTable("consents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  consentType: varchar("consentType", { length: 64 }).notNull(), // e.g., "voice_recording", "data_analysis"
  granted: boolean("granted").notNull(),
  grantedAt: timestamp("grantedAt"),
  revokedAt: timestamp("revokedAt"),
  expiresAt: timestamp("expiresAt"), // Optional expiration
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Consent = typeof consents.$inferSelect;
export type InsertConsent = typeof consents.$inferInsert;

/**
 * Data Retention table - tracks data retention policies
 */
export const dataRetention = mysqlTable("dataRetention", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull().unique(),
  retentionDays: int("retentionDays").notNull().default(30), // Default 30 days
  deleteAt: timestamp("deleteAt").notNull(), // Scheduled deletion time
  frozen: boolean("frozen").default(false), // Frozen for appeals
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DataRetention = typeof dataRetention.$inferSelect;
export type InsertDataRetention = typeof dataRetention.$inferInsert;

/**
 * Audit Log table - stores audit trail for compliance
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 128 }).notNull(), // e.g., "data_export", "data_delete"
  resourceType: varchar("resourceType", { length: 64 }).notNull(), // e.g., "match", "consent"
  resourceId: int("resourceId"),
  details: json("details").$type<Record<string, any>>(),
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Processing Task table - tracks async processing tasks
 */
export const processingTasks = mysqlTable("processingTasks", {
  id: int("id").autoincrement().primaryKey(),
  taskId: varchar("taskId", { length: 128 }).notNull().unique(),
  matchId: int("matchId").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  progress: int("progress").default(0), // Progress percentage (0-100)
  eta: timestamp("eta"), // Estimated time of arrival
  errors: json("errors").$type<string[]>(), // Array of error messages
  result: json("result").$type<Record<string, any>>(), // Processing result
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProcessingTask = typeof processingTasks.$inferSelect;
export type InsertProcessingTask = typeof processingTasks.$inferInsert;
