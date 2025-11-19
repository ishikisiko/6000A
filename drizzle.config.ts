import { defineConfig } from "drizzle-kit";
import path from "node:path";

const databaseFile = process.env.DATABASE_URL || "./data/app.sqlite";
const resolvedPath = path.resolve(databaseFile);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: resolvedPath,
  },
});
