
import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "./drizzle/schema";
import { resolve } from "node:path";

const normalizeDatabasePath = (rawPath?: string) => {
  const fallback = "data/app.sqlite";
  if (!rawPath) return resolve(fallback);
  const trimmed = rawPath.trim();
  const cleanPath = trimmed.replace(/^(sqlite:|file:)/i, "");
  return resolve(cleanPath || fallback);
};

const DB_PATH = normalizeDatabasePath(process.env.DATABASE_URL);

async function updateTeamAvatars() {
  console.log("🖼️ Updating team avatars...\n");
  console.log(`📂 Database path: ${DB_PATH}\n`);

  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite, { schema });

  const updates = [
    { name: "FMH Elite", avatar: "/team_avatars/FMH.jpg" },
    { name: "Alpha Strike", avatar: "/team_avatars/AS.jpg" },
    { name: "Shadow Ops", avatar: "/team_avatars/SO.jpg" },
  ];

  for (const update of updates) {
    const team = await db.query.teams.findFirst({
      where: eq(schema.teams.name, update.name),
    });

    if (team) {
      await db
        .update(schema.teams)
        .set({ avatar: update.avatar })
        .where(eq(schema.teams.id, team.id));
      console.log(`✅ Updated avatar for ${update.name}`);
    } else {
      console.warn(`⚠️ Team ${update.name} not found!`);
      // Optionally create it if it's missing, but the user prompt implied setting it for existing teams or ensuring they have it. 
      // If they are missing, the seed-admin-teams.ts should be run first.
      // I'll assume for now they exist or I should run the seed script if they don't.
      // But strictly speaking, if they don't exist, I can't set their avatar.
    }
  }

  console.log("\nDone!");
  sqlite.close();
}

updateTeamAvatars().catch((err) => {
  console.error("❌ Update failed:", err);
  process.exit(1);
});
