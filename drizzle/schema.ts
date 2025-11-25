import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  real,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

type JsonRecord = Record<string, unknown>;

const nowSql = () => sql`(unixepoch())`;

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    openId: text("openId").notNull(),
    name: text("name"),
    email: text("email"),
    avatar: text("avatar"), // User avatar URL or path
    loginMethod: text("loginMethod"),
    role: text("role").$type<"user" | "admin">().default("user").notNull(),
    team: text("team").default("FMH"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(nowSql())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(nowSql())
      .$onUpdate(() => new Date())
      .notNull(),
    lastSignedIn: integer("lastSignedIn", { mode: "timestamp" })
      .default(nowSql())
      .notNull(),
  },
  (table) => ({
    openIdIdx: uniqueIndex("users_openId_unique").on(table.openId),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Match table - stores information about each game match
 */
export const matches = sqliteTable(
  "matches",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    matchId: text("matchId").notNull(),
    game: text("game").notNull(), // e.g., "Valorant", "CS2"
    map: text("map").notNull(),
    teamIds: text("teamIds", { mode: "json" }).$type<string[]>().notNull(),
    startTs: integer("startTs", { mode: "timestamp" }).notNull(),
    endTs: integer("endTs", { mode: "timestamp" }).notNull(),
    userId: integer("userId").notNull(), // Owner of this match data
    metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(nowSql())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(nowSql())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    matchIdIdx: uniqueIndex("matches_matchId_unique").on(table.matchId),
  })
);

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

/**
 * Phase table - stores phase segmentation within a match
 * Phase types: hot (热手), normal (正常), slump (低迷), recovery (恢复)
 */
export const phases = sqliteTable(
  "phases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    phaseId: text("phaseId").notNull(),
    matchId: integer("matchId").notNull(),
    phaseType: text("phaseType")
      .$type<"hot" | "normal" | "slump" | "recovery">()
      .notNull(),
    startTs: integer("startTs", { mode: "timestamp" }).notNull(),
    endTs: integer("endTs", { mode: "timestamp" }).notNull(),
    changePointScore: real("changePointScore"),
    metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(nowSql())
      .notNull(),
  },
  (table) => ({
    phaseIdIdx: uniqueIndex("phases_phaseId_unique").on(table.phaseId),
  })
);

export type Phase = typeof phases.$inferSelect;
export type InsertPhase = typeof phases.$inferInsert;

/**
 * Event table - stores in-game events
 */
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchId: integer("matchId").notNull(),
  eventTs: integer("eventTs", { mode: "timestamp" }).notNull(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  positionX: real("positionX"),
  positionY: real("positionY"),
  positionZ: real("positionZ"),
  ability: text("ability"),
  success: integer("success", { mode: "boolean" }),
  metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(nowSql())
    .notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * TTD Sample table - stores Time-to-Decision samples
 */
export const ttdSamples = sqliteTable("ttdSamples", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchId: integer("matchId").notNull(),
  phaseId: integer("phaseId"),
  eventSrcTs: integer("eventSrcTs", { mode: "timestamp" }).notNull(),
  decisionTs: integer("decisionTs", { mode: "timestamp" }).notNull(),
  actionTs: integer("actionTs", { mode: "timestamp" }).notNull(),
  ttdMs: integer("ttdMs").notNull(),
  contextHash: text("contextHash"),
  metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(nowSql())
    .notNull(),
});

export type TTDSample = typeof ttdSamples.$inferSelect;
export type InsertTTDSample = typeof ttdSamples.$inferInsert;

/**
 * Voice Turn table - stores voice communication analysis
 */
export const voiceTurns = sqliteTable("voiceTurns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchId: integer("matchId").notNull(),
  speakerId: text("speakerId").notNull(),
  startTs: integer("startTs", { mode: "timestamp" }).notNull(),
  endTs: integer("endTs", { mode: "timestamp" }).notNull(),
  text: text("text"),
  clarity: real("clarity"),
  infoDensity: real("infoDensity"),
  interruption: integer("interruption", { mode: "boolean" }).default(false),
  sentiment: text("sentiment"),
  sentimentScore: real("sentimentScore"),
  metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(nowSql())
    .notNull(),
});

export type VoiceTurn = typeof voiceTurns.$inferSelect;
export type InsertVoiceTurn = typeof voiceTurns.$inferInsert;

/**
 * Duo/Trio Combo table - stores team collaboration metrics
 */
export const combos = sqliteTable("combos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchId: integer("matchId").notNull(),
  members: text("members", { mode: "json" }).$type<string[]>().notNull(),
  context: text("context"),
  attempts: integer("attempts").default(0).notNull(),
  successes: integer("successes").default(0).notNull(),
  winRate: real("winRate"),
  confidenceIntervalLow: real("confidenceIntervalLow"),
  confidenceIntervalHigh: real("confidenceIntervalHigh"),
  metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(nowSql())
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(nowSql())
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Combo = typeof combos.$inferSelect;
export type InsertCombo = typeof combos.$inferInsert;

/**
 * Bet/Vote table - stores fun betting and anonymous voting
 */
export const betVotes = sqliteTable("betVotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  topicId: text("topicId").notNull(),
  matchId: integer("matchId"),
  topicType: text("topicType").$type<"bet" | "vote" | "mission">().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  options: text("options", { mode: "json" }).$type<string[]>().notNull(),
  voterAnonId: text("voterAnonId").notNull(),
  choice: text("choice").notNull(),
  createdTs: integer("createdTs", { mode: "timestamp" })
    .default(nowSql())
    .notNull(),
  revealedTs: integer("revealedTs", { mode: "timestamp" }),
  moderationFlag: integer("moderationFlag", { mode: "boolean" }).default(false),
  metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
});

export type BetVote = typeof betVotes.$inferSelect;
export type InsertBetVote = typeof betVotes.$inferInsert;

/**
 * Topic table - stores bet/vote topics
 */
export const topics = sqliteTable(
  "topics",
  {
  id: integer("id").primaryKey({ autoIncrement: true }),
  topicId: text("topicId").notNull(),
  matchId: integer("matchId"),
  topicType: text("topicType").$type<"bet" | "vote" | "mission">().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  options: text("options", { mode: "json" }).$type<string[]>().notNull(),
  revealAt: integer("revealAt", { mode: "timestamp" }),
    status: text("status").$type<"active" | "closed" | "revealed">()
      .default("active")
      .notNull(),
    createdBy: integer("createdBy").notNull(),
    metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(nowSql())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(nowSql())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    topicIdIdx: uniqueIndex("topics_topicId_unique").on(table.topicId),
  })
);

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = typeof topics.$inferInsert;

/**
 * User Points table - stores user points and badges
 */
export const userPoints = sqliteTable(
  "userPoints",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    points: integer("points").default(0).notNull(),
    badges: text("badges", { mode: "json" }).$type<string[]>(),
    streak: integer("streak").default(0).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(nowSql())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex("userPoints_userId_unique").on(table.userId),
  })
);

export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = typeof userPoints.$inferInsert;

/**
 * Consent table - stores user consent for data processing
 */
export const consents = sqliteTable("consents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  consentType: text("consentType").notNull(),
  granted: integer("granted", { mode: "boolean" }).notNull(),
  grantedAt: integer("grantedAt", { mode: "timestamp" }),
  revokedAt: integer("revokedAt", { mode: "timestamp" }),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(nowSql())
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(nowSql())
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Consent = typeof consents.$inferSelect;
export type InsertConsent = typeof consents.$inferInsert;

/**
 * Data Retention table - tracks data retention policies
 */
export const dataRetention = sqliteTable(
  "dataRetention",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    matchId: integer("matchId").notNull(),
    retentionDays: integer("retentionDays").default(30).notNull(),
    deleteAt: integer("deleteAt", { mode: "timestamp" }).notNull(),
    frozen: integer("frozen", { mode: "boolean" }).default(false),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(nowSql())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(nowSql())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    matchIdIdx: uniqueIndex("dataRetention_matchId_unique").on(table.matchId),
  })
);

export type DataRetention = typeof dataRetention.$inferSelect;
export type InsertDataRetention = typeof dataRetention.$inferInsert;

/**
 * Audit Log table - stores audit trail for compliance
 */
export const auditLogs = sqliteTable("auditLogs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId"),
  action: text("action").notNull(),
  resourceType: text("resourceType").notNull(),
  resourceId: integer("resourceId"),
  details: text("details", { mode: "json" }).$type<JsonRecord>(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(nowSql())
    .notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Processing Task table - tracks async processing tasks
 */
export const processingTasks = sqliteTable(
  "processingTasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    taskId: text("taskId").notNull(),
    matchId: integer("matchId").notNull(),
    status: text("status")
      .$type<"pending" | "processing" | "completed" | "failed">()
      .default("pending")
      .notNull(),
    progress: integer("progress").default(0),
    eta: integer("eta", { mode: "timestamp" }),
    errors: text("errors", { mode: "json" }).$type<string[]>(),
    result: text("result", { mode: "json" }).$type<JsonRecord>(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(nowSql())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(nowSql())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    taskIdIdx: uniqueIndex("processingTasks_taskId_unique").on(table.taskId),
  })
);

export type ProcessingTask = typeof processingTasks.$inferSelect;
export type InsertProcessingTask = typeof processingTasks.$inferInsert;

/**
 * Team table - stores team information (5-person CS2/Valorant teams)
 */
export const teams = sqliteTable(
  "teams",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teamId: text("teamId").notNull(),
    name: text("name").notNull(),
    tag: text("tag"), // Short team tag like "FMH", "NaVi"
    description: text("description"),
    avatar: text("avatar"), // Avatar URL or base64
    ownerId: integer("ownerId").notNull(), // Team captain/owner
    inviteCode: text("inviteCode"), // Unique invite code
    maxMembers: integer("maxMembers").default(5).notNull(),
    isPublic: integer("isPublic", { mode: "boolean" }).default(false),
    settings: text("settings", { mode: "json" }).$type<JsonRecord>(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(nowSql())
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(nowSql())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    teamIdIdx: uniqueIndex("teams_teamId_unique").on(table.teamId),
    inviteCodeIdx: uniqueIndex("teams_inviteCode_unique").on(table.inviteCode),
  })
);

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * Team Member table - stores team membership (many-to-many between users and teams)
 */
export const teamMembers = sqliteTable(
  "teamMembers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teamId: integer("teamId").notNull(),
    userId: integer("userId").notNull(),
    role: text("role").$type<"owner" | "admin" | "member">().default("member").notNull(),
    nickname: text("nickname"), // In-game nickname within the team
    position: text("position"), // e.g., "IGL", "Entry", "AWPer", "Support", "Lurker"
    status: text("status").$type<"online" | "offline" | "in-game" | "away">().default("offline"),
    lastActiveAt: integer("lastActiveAt", { mode: "timestamp" }),
    joinedAt: integer("joinedAt", { mode: "timestamp" })
      .default(nowSql())
      .notNull(),
  },
  (table) => ({
    teamUserIdx: uniqueIndex("teamMembers_team_user_unique").on(table.teamId, table.userId),
  })
);

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
