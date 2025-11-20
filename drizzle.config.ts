import { defineConfig } from "drizzle-kit";
import path from "node:path";

const normalizeDatabasePath = (rawPath?: string) => {
  const fallback = "./data/app.sqlite";
  if (!rawPath) return path.resolve(fallback);

  const trimmed = rawPath.trim();
  const cleanPath = trimmed.replace(/^(sqlite:|file:)/i, "");

  return path.resolve(cleanPath || fallback);
};

const resolvedPath = normalizeDatabasePath(process.env.DATABASE_URL);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: resolvedPath,
  },
});
