# Repository Guidelines

## Project Structure & Module Organization
- `client/` is the Vite front end; `src/` holds React/TSX views, `public/` keeps static assets, and `vite.config.ts` points Vite’s root here.  
- `server/` contains Express, tRPC routers, and the `_core` bootstrap/Env helpers that wire the API to Vite in development.  
- `shared/` exposes shared types/constants for both client and server, keeping duplicate logic out of the bundles.  
- `drizzle/` stores schema, relations, and SQL files; `drizzle.config.ts` targets `DATABASE_URL` when running migrations.

## Build, Test, and Development Commands
- `pnpm install` (root only) to install dependencies via the pinned pnpm version.  
- `pnpm dev` boots the server (`tsx watch server/_core/index.ts`) which starts Vite in dev mode for the UI and API together.  
- `pnpm build` runs `vite build` (client → `dist/public`) and bundles the backend with `esbuild` into `dist/index.js`.  
- `pnpm start` runs the production bundle from `dist`.  
- `pnpm check` executes `tsc --noEmit` across `client`, `shared`, and `server`.  
- `pnpm format` runs Prettier according to `.prettierrc`.  
- `pnpm test` triggers `vitest run` (Node environment, tests matching `server/**/*.test.ts|spec.ts`).  
- `pnpm db:push` invokes `drizzle-kit generate` followed by `drizzle-kit migrate`.

## Coding Style & Naming Conventions
- Stick to the `.prettierrc` defaults (semicolons, double quotes, trailing commas as allowed, 2 spaces) and keep each file under ~80 characters when practical.  
- Favor `camelCase` for functions/variables, `PascalCase` for components and router modules. Match folder names to the feature (e.g., `server/routers/auth.ts`).  
- Use the configured aliases (`@/`, `@shared/`, `@assets/`) to avoid deep relative paths.

## Testing Guidelines
- Vitest handles server-side tests only; keep suites near the code they exercise and use `*.test.ts` or `*.spec.ts`.  
- Avoid importing browser-only modules in server tests so Vitest’s Node environment stays stable.  
- Run `pnpm test` before pushing and note skipped or flaky tests in the PR description.

## Commit & Pull Request Guidelines
- Prefer `type(scope): short description` messages (`feat(api): add matchmaking router`).  
- PRs should include a concise summary, testing steps (`pnpm test`, `pnpm build` etc.), links to related issues, and any relevant screenshots.

## Security & Configuration Tips
- Supply secrets through `.env` (not committed) and restart the dev server after changing `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, or `BUILT_IN_FORGE_*` keys since `dotenv/config` reads them at startup.  
- Treat `drizzle.config.ts` as a touchpoint for credentials because both migrations and `server/db.ts` pull from `DATABASE_URL`.
