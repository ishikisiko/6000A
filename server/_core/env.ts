import path from "node:path";

const normalizeDatabasePath = (rawPath?: string) => {
  const fallback = "data/app.sqlite";
  if (!rawPath) {
    return path.resolve(fallback);
  }

  const trimmed = rawPath.trim();
  const cleanPath = trimmed.replace(/^(sqlite:|file:)/i, "");

  return path.resolve(cleanPath || fallback);
};

const resolvedDatabasePath = normalizeDatabasePath(process.env.DATABASE_URL);

const resolveAppId = () => {
  const envAppId = process.env.VITE_APP_ID ?? process.env.APP_ID ?? "";
  const trimmed = envAppId.trim();
  if (trimmed.length > 0) return trimmed;

  console.warn(
    "[Env] VITE_APP_ID not set, defaulting to 'fps-coach-dev' for local auth"
  );
  return "fps-coach-dev";
};

export const ENV = {
  appId: resolveAppId(),
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: resolvedDatabasePath,
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
