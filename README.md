# BookTyper

Practice typing by typing through your favorite books. Import EPUB or PDF files and type through them page by page, tracking your speed, accuracy, and progress.

## Features

- **Book import** — Drag-and-drop EPUB and PDF files. Text is parsed and split into ~250-word pages.
- **Typing engine** — Real-time character matching with backspace support, streak tracking, and error highlighting.
- **Live stats** — Rolling WPM (10s window), accuracy, and progress displayed while typing.
- **Typewriter UI** — On-screen keyboard with key highlighting, typewriter sound effects, and streak particle effects.
- **Stats dashboard** — Session history, WPM trend chart, key accuracy heatmap, best session highlight.
- **Settings** — Font size, sound toggle, streak effects, screen shake, keyboard visibility.
- **Progress persistence** — Auto-saves every 10s, on page complete, and on tab blur. Resume where you left off.
- **Supabase backend** — Anonymous auth with row-level security. Data syncs to PostgreSQL.

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Supabase (Anonymous Auth + PostgreSQL + RLS)
- epub2 + pdfjs-dist (book parsing)
- Recharts (charts)
- Vitest (testing)

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Enable **Anonymous sign-ins** in your Supabase dashboard (Authentication > Settings).

4. Push the database schema:
   ```bash
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

### Testing

```bash
npm test
```

Runs unit tests for the typing engine, WPM calculations, and text chunker via Vitest.

## Database Schema

| Table | Purpose |
|---|---|
| `books` | Book metadata + chapters/pages as JSONB |
| `reading_progress` | Per-book cursor position and page completion |
| `typing_sessions` | Per-page session results (WPM, accuracy, duration, WPM samples) |
| `keystroke_stats` | Aggregate per-character accuracy across all sessions |

All tables use RLS scoped to `auth.uid()`. Anonymous auth creates a session automatically on first visit.

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    book/[id]/            # Book detail + typing interface
    settings/             # User preferences
    stats/                # Stats dashboard
  components/
    typing/               # Core typing UI (display, keyboard, effects, stats bar)
    stats/                # Charts and heatmaps
  hooks/                  # useTypingEngine, useStore, useAuth, useSettings
  lib/
    typing/               # Pure engine functions, WPM calculation, sounds
    parsers/              # EPUB and PDF parsing + text chunking
    supabase-store.ts     # Async Supabase data layer
    supabase.ts           # Browser client factory
    settings.ts           # Local settings (localStorage)
  types/                  # TypeScript interfaces
supabase/
  migrations/             # SQL migrations managed via Supabase CLI
```
