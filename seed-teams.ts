/**
 * Seed script for team test data
 * Run with: npx tsx seed-teams.ts
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "./drizzle/schema";
import { randomBytes } from "crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Use the same database path resolution as the app
const normalizeDatabasePath = (rawPath?: string) => {
  const fallback = "data/app.sqlite";
  if (!rawPath) {
    return resolve(fallback);
  }
  const trimmed = rawPath.trim();
  const cleanPath = trimmed.replace(/^(sqlite:|file:)/i, "");
  return resolve(cleanPath || fallback);
};

const DB_PATH = normalizeDatabasePath(process.env.DATABASE_URL);

async function seedTeams() {
  console.log("🌱 Seeding team data...\n");
  console.log(`📂 Database path: ${DB_PATH}\n`);

  // Ensure directory exists
  mkdirSync(dirname(DB_PATH), { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  // First, ensure we have some test users
  const testUsers = [
    { openId: "test_user_1", name: "Alex Storm", email: "alex@test.com", role: "user" as const },
    { openId: "test_user_2", name: "Blake Fire", email: "blake@test.com", role: "user" as const },
    { openId: "test_user_3", name: "Casey Ice", email: "casey@test.com", role: "user" as const },
    { openId: "test_user_4", name: "Drew Thunder", email: "drew@test.com", role: "user" as const },
    { openId: "test_user_5", name: "Evan Shadow", email: "evan@test.com", role: "user" as const },
    { openId: "test_user_6", name: "Fay Lightning", email: "fay@test.com", role: "user" as const },
    { openId: "test_user_7", name: "Gray Mist", email: "gray@test.com", role: "user" as const },
    { openId: "test_user_8", name: "Harper Blaze", email: "harper@test.com", role: "user" as const },
  ];

  console.log("👤 Creating test users...");
  const userIds: number[] = [];

  for (const userData of testUsers) {
    // Check if user exists
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.openId, userData.openId))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ✓ User ${userData.name} already exists (id: ${existing[0].id})`);
      userIds.push(existing[0].id);
    } else {
      const [inserted] = await db
        .insert(schema.users)
        .values({
          openId: userData.openId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          lastSignedIn: new Date(),
        })
        .returning();
      console.log(`  ✓ Created user ${userData.name} (id: ${inserted.id})`);
      userIds.push(inserted.id);
    }
  }

  // Team data
  const teamsData = [
    {
      teamId: `team_${randomBytes(8).toString("hex")}`,
      name: "Phoenix Rising",
      tag: "PHX",
      description: "我们是追求卓越的战术团队，专注于CS2竞技。欢迎有激情的玩家加入！",
      ownerId: userIds[0], // Alex Storm
      inviteCode: "PHOENIX1",
      maxMembers: 5,
      isPublic: true,
      members: [
        { userId: userIds[0], role: "owner" as const, nickname: "Storm", position: "IGL", status: "online" as const },
        { userId: userIds[1], role: "admin" as const, nickname: "Fire", position: "AWPer", status: "in-game" as const },
        { userId: userIds[2], role: "member" as const, nickname: "Ice", position: "Entry", status: "online" as const },
        { userId: userIds[3], role: "member" as const, nickname: "Thunder", position: "Support", status: "away" as const },
        { userId: userIds[4], role: "member" as const, nickname: "Shadow", position: "Lurker", status: "offline" as const },
      ],
    },
    {
      teamId: `team_${randomBytes(8).toString("hex")}`,
      name: "夜鹰突击队",
      tag: "NHK",
      description: "专业Valorant战队，周末定期训练，欢迎高水平玩家。",
      ownerId: userIds[5], // Fay Lightning
      inviteCode: "NIGHTHK",
      maxMembers: 5,
      isPublic: true,
      members: [
        { userId: userIds[5], role: "owner" as const, nickname: "闪电", position: "IGL", status: "online" as const },
        { userId: userIds[6], role: "member" as const, nickname: "迷雾", position: "Entry", status: "online" as const },
        { userId: userIds[7], role: "member" as const, nickname: "烈焰", position: "Support", status: "offline" as const },
      ],
    },
    {
      teamId: `team_${randomBytes(8).toString("hex")}`,
      name: "Solo Warriors",
      tag: "SW",
      description: "休闲玩家聚集地，一起开黑不寂寞！",
      ownerId: userIds[2], // Casey Ice
      inviteCode: "SOLOWRS",
      maxMembers: 5,
      isPublic: false,
      members: [
        { userId: userIds[2], role: "owner" as const, nickname: null, position: "Flex", status: "online" as const },
      ],
    },
  ];

  console.log("\n🏆 Creating teams...");

  for (const teamData of teamsData) {
    // Check if team with same invite code exists
    const existingTeam = await db
      .select()
      .from(schema.teams)
      .where(eq(schema.teams.inviteCode, teamData.inviteCode))
      .limit(1);

    if (existingTeam.length > 0) {
      console.log(`  ⏭ Team ${teamData.name} already exists, skipping...`);
      continue;
    }

    // Create team
    const [team] = await db
      .insert(schema.teams)
      .values({
        teamId: teamData.teamId,
        name: teamData.name,
        tag: teamData.tag,
        description: teamData.description,
        ownerId: teamData.ownerId,
        inviteCode: teamData.inviteCode,
        maxMembers: teamData.maxMembers,
        isPublic: teamData.isPublic,
      })
      .returning();

    console.log(`  ✓ Created team: ${team.name} [${team.tag}] (invite: ${team.inviteCode})`);

    // Add members
    for (const memberData of teamData.members) {
      await db.insert(schema.teamMembers).values({
        teamId: team.id,
        userId: memberData.userId,
        role: memberData.role,
        nickname: memberData.nickname,
        position: memberData.position,
        status: memberData.status,
        lastActiveAt: new Date(),
      });
      console.log(`    + Added member: ${memberData.nickname || "Unknown"} (${memberData.role})`);
    }
  }

  console.log("\n✅ Team seeding complete!");
  console.log("\n📋 Summary:");
  console.log(`   - Users: ${testUsers.length}`);
  console.log(`   - Teams: ${teamsData.length}`);
  console.log("\n🔑 Test invite codes:");
  teamsData.forEach((t) => {
    console.log(`   - ${t.name}: ${t.inviteCode}`);
  });

  sqlite.close();
}

seedTeams().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
