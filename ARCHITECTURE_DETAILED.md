# FPS Coach AI - Detailed Project Architecture

## 1. System Overview

**FPS Coach AI** is a full-stack application designed to analyze FPS game match data, provide AI-powered coaching, and foster community engagement through gamification (betting/voting).

- **Frontend:** React 19 (Vite), Tailwind CSS v4, Radix UI, Recharts, Framer Motion.
- **Backend:** Node.js (Express), tRPC, SQLite (Better-SQLite3), Drizzle ORM.
- **AI/ML:** Anthropic (Claude) via custom proxy for coaching; Internal Image Service for asset generation.
- **Integrations:** Discord Bot (discord.js), Google Maps (for location-based features if any).

## 2. Database Schema (`drizzle/schema.ts`)

The database is relational, built on SQLite.

### Core Entities
- **`users`**: User identity (includes Discord ID, steamId, points).
- **`teams`**: Groups of users.
- **`team_members`**: Join table for User-Team many-to-many relationship (includes roles like 'owner', 'member').
- **`matches`**: Game records (map, score, duration, upload timestamp).

### Analytics Data (High Frequency)
- **`phases`**: Periods of game flow (e.g., "hot" streak, "slump", "recovery") with start/end timestamps.
- **`events`**: Discrete game actions (kill, death, plant, defuse) linked to matches and rounds.
- **`ttd_samples`** (Time-to-Decision): Millisecond-level measurements of player reaction times.
- **`voice_turns`**: Analysis of voice comms (clarity, duration, speaker).
- **`combos`**: Performance stats for specific player combinations.

### Community & Gamification
- **`topics`**: Betting/Voting subjects (e.g., "Will Team A win?").
- **`bet_votes`**: User wagers on topics.
- **`user_points`**: Transaction log for point gains/losses.

## 3. Server Architecture (`server/`)

### API Layer (tRPC)
Located in `server/routers.ts` and `server/routers/*.ts`.

- **`appRouter`**: Root router merging all sub-routers.
- **`teamRouter`**:
  - `create`: Create a new team.
  - `join`: Join an existing team via invite code.
  - `list`: List user's teams.
  - `members`: Get team roster.
- **`chatRouter`**:
  - `sendMessage`: Main AI interaction endpoint. Fetches context (recent matches, user stats) and invokes `llm.ts`. Can trigger "tools" to create missions.
- **`topicsRouter`**:
  - `list`: Get active voting topics.
  - `create`: Admin creation of new topics.
  - `submit`: User voting/betting.
  - `settle`: Admin resolution of bets.
- **`matchRouter`** (in `routers.ts`):
  - `list`: Get recent matches.
  - `get`: Get full details for a specific match.
  - `upload`: Handle demo file parsing and insertion (simulated).

### Core Services (`server/_core/`)

#### AI & LLM (`server/_core/llm.ts`)
- **`invokeLLM(params)`**: Wrapper around the LLM provider (Gemini/Claude).
  - Handles message history, system prompts, and **Tool Calling**.
  - Supports JSON Schema output enforcement.
  - `model`: Defaults to "gemini-2.5-flash".

#### Image Generation (`server/_core/imageGeneration.ts`)
- **`generateImage(options)`**: Uses an internal Forge API to generate images from text prompts.
- Saves results to local storage/S3 and returns a URL.

#### Discord Bot (`server/discord/`)
- **`bot.ts`**: Independent process (initialized in server startup).
  - **Commands**:
    - `!stats`, `!matches`: Query DB for user stats.
    - `!topics`, `!vote`: Participate in betting system from Discord.
    - `!ask <question>`: Direct AI chat interface.
    - `!join/!leave`: Voice channel management.
  - **`topic-generator.ts`**: Helper to auto-generate betting topics based on match events.

#### Authentication (`server/_core/context.ts`)
- **`createContext`**: Runs on every request.
- Validates session cookies.
- Attaches `user` object to `ctx`.
- Uses a local dev-friendly auth strategy (simulated OpenID).

## 4. Client Architecture (`client/src/`)

### Key Pages (`pages/`)
- **`Dashboard.tsx`**: Main hub. Displays active topics, recent match summary, and quick AI chat.
- **`Matches.tsx`**: List view of match history.
- **`Analysis.tsx` / `MatchDetail.tsx`**: Deep dive into a specific match using visualizations.
- **`Teams.tsx`**: Team management interface.
- **`Topics.tsx`**: Voting and betting center.

### Critical Components (`components/`)

#### `AIChatBox.tsx`
- **Role**: Specialized chat UI for the Coach AI.
- **Features**:
  - Markdown rendering (via `streamdown`).
  - Auto-scroll management.
  - Type-safe message history (shares types with server).
  - Displays "Thinking..." states.

#### Analytics Charts (`components/analytics/MatchAnalysisCharts.tsx`)
Powered by `Recharts`.
1.  **`PhaseBreakdownChart`**: Bar chart showing time spent in "Hot", "Normal", or "Slump" states.
2.  **`TTDDistributionChart`**: Complex flip-card component.
    - **Front**: Line chart of Average TTD over the last 5 matches.
    - **Back**: Histogram of TTD samples for the current match.
3.  **`VoiceQualityChart`**: Radar chart visualizing Communication Clarity, Info Density, and Interruption Rate.
4.  **`ComboWinRateChart`**: Bar chart ranking player duo/trio win rates.

#### `Map.tsx`
- **Role**: Wrapper for Google Maps JavaScript API.
- **Features**:
  - Lazy loading of the Maps script.
  - Exposes `onMapReady` callback for parent components to add markers/overlays.
  - Used for visualizing player positions or grenade trajectories (potential feature).

## 5. Data Flow Examples

### Scenario: User Asks AI for Advice
1.  **User** types "How is my aim lately?" in `AIChatBox`.
2.  **Client** calls `trpc.chat.sendMessage`.
3.  **Server (`chatRouter`)**:
    - Fetches last 5 matches from DB (`drizzle`).
    - Calculates average Headshot % and TTD.
    - Constructs a System Prompt with this data.
4.  **LLM Service (`invokeLLM`)**: Sends prompt to Anthropic/Gemini.
5.  **Response**: AI replies "Your reaction time is good (avg 300ms), but headshot % dropped to 15% in the last match on Dust2."
6.  **Client**: Renders response in `AIChatBox`.

### Scenario: Discord Betting
1.  **Discord User** types `!vote topic_123 "Team A"`.
2.  **Bot**:
    - Checks `users` table for discord ID.
    - Checks `topics` table for validity and status.
    - Inserts row into `bet_votes`.
    - Deducts points from `users`.
3.  **Response**: Bot replies "✅ Bet placed on Team A!".
