/**
 * 为Admin用户生成团队相关的完整模拟数据
 * 运行命令: pnpm tsx seed-admin-teams.ts
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, and } from "drizzle-orm";
import * as schema from "./drizzle/schema";
import { randomBytes } from "crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const { users, teams, teamMembers } = schema;

// 数据库路径解析
const normalizeDatabasePath = (rawPath?: string) => {
  const fallback = "data/app.sqlite";
  if (!rawPath) return resolve(fallback);
  const trimmed = rawPath.trim();
  const cleanPath = trimmed.replace(/^(sqlite:|file:)/i, "");
  return resolve(cleanPath || fallback);
};

const DB_PATH = normalizeDatabasePath(process.env.DATABASE_URL);

// 生成随机邀请码
const generateInviteCode = () => randomBytes(4).toString("hex").toUpperCase();

// 生成teamId
const generateTeamId = () => `team_${randomBytes(8).toString("hex")}`;

// 模拟队友数据 - FPS游戏风格的名字
const mockTeammates = [
  { name: "NightHawk", email: "nighthawk@fps.gg", position: "IGL" },
  { name: "SilentStrike", email: "silent@fps.gg", position: "AWPer" },
  { name: "PhantomX", email: "phantom@fps.gg", position: "Entry" },
  { name: "ShadowBlade", email: "shadow@fps.gg", position: "Support" },
  { name: "VenomRush", email: "venom@fps.gg", position: "Lurker" },
  { name: "IceBreaker", email: "ice@fps.gg", position: "Flex" },
  { name: "BlazeFury", email: "blaze@fps.gg", position: "Entry" },
  { name: "StormRider", email: "storm@fps.gg", position: "Support" },
  { name: "DeathWhisper", email: "death@fps.gg", position: "AWPer" },
  { name: "CyberWolf", email: "cyber@fps.gg", position: "IGL" },
  { name: "RapidFire", email: "rapid@fps.gg", position: "Entry" },
  { name: "GhostSniper", email: "ghost@fps.gg", position: "AWPer" },
  { name: "TitanForce", email: "titan@fps.gg", position: "Support" },
  { name: "NeonSpark", email: "neon@fps.gg", position: "Lurker" },
  { name: "AceHunter", email: "ace@fps.gg", position: "Entry" },
];

// Admin的团队数据
const adminTeamsData = [
  {
    name: "FMH Elite",
    tag: "FMH",
    description: "Admin的主战队，专注于CS2职业级竞技训练。每周三、五、日晚上8点训练。",
    isPublic: false,
    memberCount: 5,
    status: ["online", "online", "in-game", "away", "offline"] as const,
  },
  {
    name: "Alpha Strike",
    tag: "ALPHA",
    description: "精英突击小队，专攻快速战术执行和团队配合。",
    isPublic: true,
    memberCount: 5,
    status: ["online", "in-game", "in-game", "online", "away"] as const,
  },
  {
    name: "Shadow Ops",
    tag: "SHDW",
    description: "隐秘行动队，擅长信息收集和战术分析。",
    isPublic: true,
    memberCount: 4,
    status: ["online", "offline", "online", "away"] as const,
  },
];

// 可发现的公开团队（非Admin的）
const discoverableTeams = [
  {
    name: "龙之息",
    tag: "DRG",
    description: "华人顶尖战队，寻找有潜力的新成员。要求：至少大地球。",
    memberCount: 5,
    ownerName: "DragonKing",
    isPublic: true,
  },
  {
    name: "Pixel Warriors",
    tag: "PXL",
    description: "休闲竞技战队，友好氛围，欢迎新手加入！",
    memberCount: 3,
    ownerName: "PixelMaster",
    isPublic: true,
  },
  {
    name: "Midnight Hunters",
    tag: "MNH",
    description: "夜猫子集结！专门在深夜时段训练和比赛。",
    memberCount: 4,
    ownerName: "MidnightOwl",
    isPublic: true,
  },
  {
    name: "Rising Legends",
    tag: "RISE",
    description: "新生代战队，目标是打入顶级联赛。招募中！",
    memberCount: 4,
    ownerName: "LegendRiser",
    isPublic: true,
  },
  {
    name: "Tactical Masters",
    tag: "TACT",
    description: "战术至上，配合第一。需要有基础的战术理解能力。",
    memberCount: 5,
    ownerName: "TacticPro",
    isPublic: true,
  },
];

async function seedAdminTeams() {
  console.log("🚀 开始为Admin用户生成团队数据...\n");
  console.log(`📂 数据库路径: ${DB_PATH}\n`);

  mkdirSync(dirname(DB_PATH), { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  try {
    // 1. 确保Admin用户存在
    const adminOpenId = "dev_admin";
    await db
      .insert(users)
      .values({
        openId: adminOpenId,
        name: "Admin",
        email: "admin@example.com",
        team: "FMH",
        role: "admin",
      })
      .onConflictDoNothing();

    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, adminOpenId))
      .limit(1);

    if (!adminUser.length) {
      throw new Error("无法创建或找到Admin用户");
    }

    const adminId = adminUser[0].id;
    console.log(`✅ Admin用户ID: ${adminId}\n`);

    // 2. 创建Admin的队友用户
    console.log("👥 创建模拟队友...");
    const teammateIds: number[] = [];

    for (const mate of mockTeammates) {
      const openId = `mock_${mate.email.split("@")[0]}`;
      await db
        .insert(users)
        .values({
          openId,
          name: mate.name,
          email: mate.email,
          role: "user",
        })
        .onConflictDoNothing();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1);

      if (user) {
        teammateIds.push(user.id);
        console.log(`  ✓ ${mate.name} (${mate.position})`);
      }
    }

    // 3. 创建Admin的团队
    console.log("\n🏆 创建Admin的团队...");
    let mateIndex = 0;

    for (const teamData of adminTeamsData) {
      // 检查团队是否已存在
      const existingTeam = await db
        .select()
        .from(teams)
        .where(eq(teams.name, teamData.name))
        .limit(1);

      if (existingTeam.length > 0) {
        console.log(`  ⏭ 团队 ${teamData.name} 已存在，跳过...`);
        continue;
      }

      const inviteCode = generateInviteCode();
      const [team] = await db
        .insert(teams)
        .values({
          teamId: generateTeamId(),
          name: teamData.name,
          tag: teamData.tag,
          description: teamData.description,
          ownerId: adminId,
          inviteCode,
          maxMembers: 5,
          isPublic: teamData.isPublic,
        })
        .returning();

      console.log(`  ✓ 创建团队: ${team.name} [${team.tag}] (邀请码: ${inviteCode})`);

      // 添加Admin作为owner
      await db.insert(teamMembers).values({
        teamId: team.id,
        userId: adminId,
        role: "owner",
        nickname: "Admin",
        position: "IGL",
        status: "online",
        lastActiveAt: new Date(),
      });
      console.log(`    + Admin (owner, IGL)`);

      // 添加队友
      const positions = ["AWPer", "Entry", "Support", "Lurker"];
      for (let i = 0; i < teamData.memberCount - 1 && mateIndex < teammateIds.length; i++) {
        const mate = mockTeammates[mateIndex];
        await db.insert(teamMembers).values({
          teamId: team.id,
          userId: teammateIds[mateIndex],
          role: i === 0 ? "admin" : "member",
          nickname: mate.name,
          position: positions[i] || "Flex",
          status: teamData.status[i + 1] || "offline",
          lastActiveAt: new Date(Date.now() - Math.random() * 86400000), // 随机24小时内
        });
        console.log(`    + ${mate.name} (${i === 0 ? "admin" : "member"}, ${positions[i] || "Flex"})`);
        mateIndex++;
      }
    }

    // 4. 创建可发现的公开团队
    console.log("\n🌍 创建可发现的公开团队...");

    for (const teamData of discoverableTeams) {
      // 检查团队是否已存在
      const existingTeam = await db
        .select()
        .from(teams)
        .where(eq(teams.name, teamData.name))
        .limit(1);

      if (existingTeam.length > 0) {
        console.log(`  ⏭ 团队 ${teamData.name} 已存在，跳过...`);
        continue;
      }

      // 创建团队owner用户
      const ownerOpenId = `mock_${teamData.ownerName.toLowerCase()}`;
      await db
        .insert(users)
        .values({
          openId: ownerOpenId,
          name: teamData.ownerName,
          email: `${teamData.ownerName.toLowerCase()}@fps.gg`,
          role: "user",
        })
        .onConflictDoNothing();

      const [ownerUser] = await db
        .select()
        .from(users)
        .where(eq(users.openId, ownerOpenId))
        .limit(1);

      if (!ownerUser) continue;

      const inviteCode = generateInviteCode();
      const [team] = await db
        .insert(teams)
        .values({
          teamId: generateTeamId(),
          name: teamData.name,
          tag: teamData.tag,
          description: teamData.description,
          ownerId: ownerUser.id,
          inviteCode,
          maxMembers: 5,
          isPublic: true,
        })
        .returning();

      console.log(`  ✓ 创建团队: ${team.name} [${team.tag}]`);

      // 添加owner
      await db.insert(teamMembers).values({
        teamId: team.id,
        userId: ownerUser.id,
        role: "owner",
        nickname: teamData.ownerName,
        position: "IGL",
        status: Math.random() > 0.5 ? "online" : "offline",
        lastActiveAt: new Date(Date.now() - Math.random() * 86400000),
      });

      // 添加一些随机队友
      const memberPositions = ["AWPer", "Entry", "Support", "Lurker"];
      const statuses: Array<"online" | "offline" | "in-game" | "away"> = ["online", "offline", "in-game", "away"];

      for (let i = 0; i < teamData.memberCount - 1 && mateIndex < teammateIds.length; i++) {
        // 创建新用户作为队友
        const memberName = `${teamData.tag}_Player${i + 1}`;
        const memberOpenId = `mock_${teamData.tag.toLowerCase()}_p${i + 1}`;
        
        await db
          .insert(users)
          .values({
            openId: memberOpenId,
            name: memberName,
            email: `${memberName.toLowerCase()}@fps.gg`,
            role: "user",
          })
          .onConflictDoNothing();

        const [memberUser] = await db
          .select()
          .from(users)
          .where(eq(users.openId, memberOpenId))
          .limit(1);

        if (memberUser) {
          await db
            .insert(teamMembers)
            .values({
              teamId: team.id,
              userId: memberUser.id,
              role: "member",
              nickname: memberName,
              position: memberPositions[i] || "Flex",
              status: statuses[Math.floor(Math.random() * statuses.length)],
              lastActiveAt: new Date(Date.now() - Math.random() * 86400000),
            })
            .onConflictDoNothing();
        }
      }
      console.log(`    + 添加 ${teamData.memberCount} 名成员`);
    }

    // 5. 输出摘要
    console.log("\n" + "═".repeat(50));
    console.log("✅ 团队数据生成完成!\n");

    // 统计数据
    const allTeams = await db.select().from(teams);
    const allMembers = await db.select().from(teamMembers);
    const adminTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.ownerId, adminId));

    console.log("📊 数据统计:");
    console.log(`   - 总团队数: ${allTeams.length}`);
    console.log(`   - Admin拥有的团队: ${adminTeams.length}`);
    console.log(`   - 总成员关系: ${allMembers.length}`);

    console.log("\n🔑 Admin的团队邀请码:");
    for (const t of adminTeams) {
      const memberCount = allMembers.filter((m) => m.teamId === t.id).length;
      console.log(`   - ${t.name} [${t.tag}]: ${t.inviteCode} (${memberCount}/5人)`);
    }

    console.log("\n🌐 可发现的公开团队:");
    const publicTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.isPublic, true));

    for (const t of publicTeams) {
      const memberCount = allMembers.filter((m) => m.teamId === t.id).length;
      console.log(`   - ${t.name} [${t.tag}] (${memberCount}/5人)`);
    }

  } catch (error) {
    console.error("❌ 生成失败:", error);
    throw error;
  } finally {
    sqlite.close();
  }
}

seedAdminTeams().catch((err) => {
  console.error("❌ 脚本执行失败:", err);
  process.exit(1);
});
