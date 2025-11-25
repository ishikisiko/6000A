/**
 * 为Admin和FMH Elite成员设置头像
 * 运行命令: pnpm tsx seed-avatars.ts
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, and } from "drizzle-orm";
import * as schema from "./drizzle/schema";
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

async function seedAvatars() {
  console.log("🖼️  开始为用户设置头像...\n");
  console.log(`📂 数据库路径: ${DB_PATH}\n`);

  mkdirSync(dirname(DB_PATH), { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  try {
    // 1. 为Admin用户设置头像 tx0
    const adminOpenId = "dev_admin";
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.openId, adminOpenId))
      .limit(1);

    if (adminUser) {
      await db
        .update(users)
        .set({ avatar: "/Image/tx0.jpg" })
        .where(eq(users.id, adminUser.id));
      console.log(`✅ Admin (${adminUser.name}) 设置头像: /Image/tx0.jpg`);
    } else {
      console.log("⚠️ 未找到Admin用户");
    }

    // 2. 找到FMH Elite战队
    const [fmhTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.name, "FMH Elite"))
      .limit(1);

    if (!fmhTeam) {
      console.log("⚠️ 未找到FMH Elite战队");
    } else {
      console.log(`\n📋 找到FMH Elite战队 (ID: ${fmhTeam.id})`);

      // 获取该战队的所有成员
      const members = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamId, fmhTeam.id));

      console.log(`   共有 ${members.length} 名成员\n`);

      // 为非Admin的成员设置头像 tx1-tx4
      let avatarIndex = 1;
      for (const member of members) {
        // 跳过Admin（已设置tx0）
        if (adminUser && member.userId === adminUser.id) {
          continue;
        }

        // 获取用户信息
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, member.userId))
          .limit(1);

        if (user && avatarIndex <= 4) {
          const avatarPath = `/Image/tx${avatarIndex}.jpg`;
          await db
            .update(users)
            .set({ avatar: avatarPath })
            .where(eq(users.id, user.id));
          console.log(`✅ ${user.name} 设置头像: ${avatarPath}`);
          avatarIndex++;
        }
      }
    }

    console.log("\n" + "═".repeat(50));
    console.log("✅ 头像设置完成!\n");

    // 显示所有有头像的用户
    const usersWithAvatar = await db
      .select()
      .from(users)
      .where(eq(users.avatar, users.avatar)); // 只是为了获取所有用户

    const avatarUsers = usersWithAvatar.filter(u => u.avatar);
    console.log("📊 有头像的用户:");
    for (const u of avatarUsers) {
      console.log(`   - ${u.name}: ${u.avatar}`);
    }

  } catch (error) {
    console.error("❌ 设置失败:", error);
    throw error;
  } finally {
    sqlite.close();
  }
}

seedAvatars().catch((err) => {
  console.error("❌ 脚本执行失败:", err);
  process.exit(1);
});
