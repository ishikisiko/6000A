import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  InsertUser,
  users,
  matches,
  Match,
  InsertMatch,
  phases,
  Phase,
  InsertPhase,
  events,
  Event,
  InsertEvent,
  ttdSamples,
  TTDSample,
  InsertTTDSample,
  voiceTurns,
  VoiceTurn,
  InsertVoiceTurn,
  combos,
  Combo,
  InsertCombo,
  betVotes,
  BetVote,
  InsertBetVote,
  topics,
  Topic,
  InsertTopic,
  userPoints,
  UserPoints,
  consents,
  Consent,
  InsertConsent,
  dataRetention,
  DataRetention,
  InsertDataRetention,
  auditLogs,
  AuditLog,
  InsertAuditLog,
  processingTasks,
  ProcessingTask,
  InsertProcessingTask,
} from "../drizzle/schema";
import * as schema from "../drizzle/schema";
import { ENV } from "./_core/env";

let sqlite: Database | null = null;
let _db: BetterSQLite3Database<typeof schema> | null = null;
let initPromise: Promise<BetterSQLite3Database<typeof schema> | null> | null = null;
let migrationPromise: Promise<void> | null = null;

async function runMigrations(db: BetterSQLite3Database<typeof schema>) {
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    try {
      migrate(db, {
        migrationsFolder: join(process.cwd(), "drizzle"),
      });
    } catch (error) {
      migrationPromise = null;
      throw error;
    }
  })();

  return migrationPromise;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (_db) {
    return _db;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const dbPath = ENV.databaseUrl;
      mkdirSync(dirname(dbPath), { recursive: true });
      sqlite = new Database(dbPath);
      sqlite.pragma("journal_mode = WAL");
      sqlite.pragma("foreign_keys = ON");

      const db = drizzle(sqlite, { schema });
      await runMigrations(db);
      _db = db;
      return _db;
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      sqlite = null;
      _db = null;
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Match operations
export async function createMatch(match: InsertMatch): Promise<Match> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(matches).values(match).returning();
  if (!inserted) {
    throw new Error("Failed to insert match");
  }
  return inserted;
}

export async function getMatchById(id: number): Promise<Match | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
  return result[0];
}

export async function getMatchByMatchId(matchId: string): Promise<Match | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(matches).where(eq(matches.matchId, matchId)).limit(1);
  return result[0];
}

export async function getMatchesByUserId(userId: number, limit: number = 50): Promise<Match[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(matches).where(eq(matches.userId, userId)).orderBy(desc(matches.startTs)).limit(limit);
}

// Phase operations
export async function createPhase(phase: InsertPhase): Promise<Phase> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(phases).values(phase).returning();
  if (!inserted) {
    throw new Error("Failed to insert phase");
  }
  return inserted;
}

export async function getPhasesByMatchId(matchId: number): Promise<Phase[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(phases).where(eq(phases.matchId, matchId)).orderBy(asc(phases.startTs));
}

// Event operations
export async function createEvent(event: InsertEvent): Promise<Event> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(events).values(event).returning();
  if (!inserted) {
    throw new Error("Failed to insert event");
  }
  return inserted;
}

export async function getEventsByMatchId(matchId: number, startTs?: Date, endTs?: Date): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(events).where(eq(events.matchId, matchId));

  if (startTs && endTs) {
    query = db.select().from(events).where(
      and(
        eq(events.matchId, matchId),
        gte(events.eventTs, startTs),
        lte(events.eventTs, endTs)
      )
    );
  }

  return await query.orderBy(asc(events.eventTs));
}

// TTD Sample operations
export async function createTTDSample(sample: InsertTTDSample): Promise<TTDSample> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(ttdSamples).values(sample).returning();
  if (!inserted) {
    throw new Error("Failed to insert TTD sample");
  }
  return inserted;
}

export async function getTTDSamplesByMatchId(matchId: number, phaseId?: number): Promise<TTDSample[]> {
  const db = await getDb();
  if (!db) return [];

  if (phaseId) {
    return await db.select().from(ttdSamples).where(
      and(eq(ttdSamples.matchId, matchId), eq(ttdSamples.phaseId, phaseId))
    ).orderBy(asc(ttdSamples.eventSrcTs));
  }

  return await db.select().from(ttdSamples).where(eq(ttdSamples.matchId, matchId)).orderBy(asc(ttdSamples.eventSrcTs));
}

// Voice Turn operations
export async function createVoiceTurn(turn: InsertVoiceTurn): Promise<VoiceTurn> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(voiceTurns).values(turn).returning();
  if (!inserted) {
    throw new Error("Failed to insert voice turn");
  }
  return inserted;
}

export async function getVoiceTurnsByMatchId(matchId: number): Promise<VoiceTurn[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(voiceTurns).where(eq(voiceTurns.matchId, matchId)).orderBy(asc(voiceTurns.startTs));
}

// Combo operations
export async function createCombo(combo: InsertCombo): Promise<Combo> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(combos).values(combo).returning();
  if (!inserted) {
    throw new Error("Failed to insert combo");
  }
  return inserted;
}

export async function getCombosByMatchId(matchId: number): Promise<Combo[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(combos).where(eq(combos.matchId, matchId)).orderBy(desc(combos.winRate));
}

// Topic operations
export async function createTopic(topic: InsertTopic): Promise<Topic> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(topics).values(topic).returning();
  if (!inserted) {
    throw new Error("Failed to insert topic");
  }
  return inserted;
}

export async function getTopicByTopicId(topicId: string): Promise<Topic | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(topics).where(eq(topics.topicId, topicId)).limit(1);
  return result[0];
}

export async function getActiveTopics(matchId?: number): Promise<Topic[]> {
  const db = await getDb();
  if (!db) return [];

  if (matchId) {
    return await db.select().from(topics).where(
      and(eq(topics.matchId, matchId), eq(topics.status, 'active'))
    ).orderBy(desc(topics.createdAt));
  }

  return await db.select().from(topics).where(eq(topics.status, 'active')).orderBy(desc(topics.createdAt));
}

export async function getTopicById(topicId: string): Promise<Topic | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(topics).where(eq(topics.topicId, topicId)).limit(1);
  return result[0];
}

export async function updateTopicStatus(topicId: string, status: 'active' | 'closed' | 'revealed'): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(topics).set({ status }).where(eq(topics.topicId, topicId));
}

// BetVote operations
export async function createBetVote(betVote: InsertBetVote): Promise<BetVote> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(betVotes).values(betVote).returning();
  if (!inserted) {
    throw new Error("Failed to insert bet vote");
  }
  return inserted;
}

export async function getBetVotesByTopicId(topicId: string): Promise<BetVote[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(betVotes).where(eq(betVotes.topicId, topicId));
}

export async function getBetVotesByUserId(userId: number): Promise<BetVote[]> {
  const db = await getDb();
  if (!db) return [];

  // Find votes where metadata contains the userId
  const allVotes = await db.select().from(betVotes);
  return allVotes.filter(v => (v.metadata as any)?.userId === userId);
}

export async function settleTopicResults(topicId: string, correctChoice: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update topic status
  await db.update(topics).set({ status: 'revealed' }).where(eq(topics.topicId, topicId));

  // Get all votes for this topic
  const votes = await getBetVotesByTopicId(topicId);
  const correctVotes = votes.filter(v => v.choice === correctChoice);
  const totalPoints = votes.reduce((sum, v) => sum + ((v.metadata as any)?.points || 0), 0);
  const correctPoints = correctVotes.reduce((sum, v) => sum + ((v.metadata as any)?.points || 0), 0);

  // Distribute points to winners
  if (correctVotes.length > 0 && correctPoints > 0) {
    for (const vote of correctVotes) {
      const userId = (vote.metadata as any)?.userId;
      const betPoints = (vote.metadata as any)?.points || 0;

      if (userId && betPoints > 0) {
        // Calculate winnings (proportional to bet)
        const winnings = Math.floor((betPoints / correctPoints) * totalPoints);
        const currentPoints = await getUserPoints(userId);
        await updateUserPoints(userId, (currentPoints?.points || 0) + winnings);
      }
    }
  }
}

// User Points operations
export async function getUserPoints(userId: number): Promise<UserPoints | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
  return result[0];
}

export async function updateUserPoints(userId: number, points: number, badges?: string[], streak?: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserPoints(userId);

  if (existing) {
    const updateData: any = { points: Math.max(0, existing.points + points) }; // Prevent negative points
    if (badges) updateData.badges = badges;
    if (streak !== undefined) updateData.streak = streak;

    await db.update(userPoints).set(updateData).where(eq(userPoints.userId, userId));
  } else {
    await db.insert(userPoints).values({
      userId,
      points: Math.max(0, points),
      badges: badges || [],
      streak: streak || 0
    });
  }
}

// Processing Task operations
export async function createProcessingTask(task: InsertProcessingTask): Promise<ProcessingTask> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(processingTasks).values(task).returning();
  if (!inserted) {
    throw new Error("Failed to insert processing task");
  }
  return inserted;
}

export async function getProcessingTaskByTaskId(taskId: string): Promise<ProcessingTask | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(processingTasks).where(eq(processingTasks.taskId, taskId)).limit(1);
  return result[0];
}

export async function updateProcessingTask(taskId: string, updates: Partial<ProcessingTask>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(processingTasks).set(updates).where(eq(processingTasks.taskId, taskId));
}

// Audit Log operations
export async function createAuditLog(log: InsertAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(auditLogs).values(log);
}

// Consent operations
export async function createConsent(consent: InsertConsent): Promise<Consent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(consents).values(consent).returning();
  if (!inserted) {
    throw new Error("Failed to insert consent");
  }
  return inserted;
}

export async function getUserConsents(userId: number): Promise<Consent[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(consents).where(eq(consents.userId, userId)).orderBy(desc(consents.createdAt));
}

// Data Retention operations
export async function createDataRetention(retention: InsertDataRetention): Promise<DataRetention> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(dataRetention).values(retention).returning();
  if (!inserted) {
    throw new Error("Failed to insert data retention row");
  }
  return inserted;
}

export async function getExpiredDataRetentions(): Promise<DataRetention[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(dataRetention).where(
    and(
      lte(dataRetention.deleteAt, new Date()),
      eq(dataRetention.frozen, false)
    )
  );
}
