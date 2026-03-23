# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo containing two projects:

1. **Root (`index.html`)** - A static, single-file PWA for half-marathon training schedules
2. **`stride-app/`** - A full-stack web application for AI-powered running training with Strava integration

## Key Commands

### stride-app/ (Next.js Application)

From the `stride-app/` directory:

- **Development**: `npm run dev` - Starts Next.js dev server on `http://localhost:3001`
- **Build**: `npm run build` - Builds for production
- **Start**: `npm start` - Runs production build locally
- **Lint**: `npm run lint src/` - Runs ESLint on `src/` directory (TypeScript/TSX files)

### Root Project (Static HTML)

- **Local server**: `python3 -m http.server 8000` from the root directory, then open `http://localhost:8000/` (recommended for PWA features)
- **Direct open**: Open `index.html` directly in a browser (some PWA features like service workers may not work via `file://`)

## Architecture & Code Organization

### stride-app/ Structure

```
stride-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout with theme/auth providers
│   │   ├── page.tsx                  # Home/dashboard page
│   │   ├── login/page.tsx            # Authentication page
│   │   ├── onboarding/page.tsx       # User onboarding flow
│   │   ├── plan/page.tsx             # Training plan view and interactions
│   │   ├── settings/page.tsx         # User settings
│   │   ├── globals.css               # Global styles with custom CSS variables
│   │   └── api/                      # API routes
│   │       ├── ai/feedback/          # Gemini AI coach feedback endpoint
│   │       ├── strava/auth/          # Strava OAuth initiation
│   │       ├── strava/callback/      # Strava OAuth callback handler
│   │       └── test/templates/       # Testing endpoint for plan templates
│   ├── components/                   # Reusable React components
│   │   ├── SessionCard.tsx           # Individual training session card
│   │   └── LogSessionModal.tsx       # Modal for logging completed workouts
│   ├── lib/                          # Utility functions and services
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser-side Supabase client (createClient)
│   │   │   └── server.ts             # Server-side Supabase client (createClient)
│   │   ├── gemini.ts                 # Google Gemini AI integration
│   │   ├── strava.ts                 # Strava OAuth and API utilities
│   │   └── plan-templates.ts         # Pre-built training plan templates
│   └── types/
│       ├── database.ts               # Supabase table types (auto-generated)
│       └── index.ts                  # Domain types (User, Plan, Session, etc.)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    # Database schema with Row Level Security
└── public/                           # Static assets
```

### Tech Stack Details

- **Framework**: Next.js 16 (App Router) with TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 with custom CSS variables in `:root` for theming
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **AI**: Google Generative AI (Gemini 1.5 Flash) for coach feedback
- **Auth**: Supabase authentication with OAuth (Strava)
- **State**: Zustand for client-side state management
- **UI Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **Linting**: ESLint with Next.js and TypeScript rules

### Key Architecture Patterns

1. **Supabase Integration**:
   - Two client types: `lib/supabase/client.ts` for browser and `lib/supabase/server.ts` for server routes
   - Database tables: `profiles`, `plan_templates`, `training_plans`, `sessions`, `workout_logs`
   - Row Level Security enabled for data isolation

2. **AI Feedback Flow**:
   - `/api/ai/feedback` endpoint accepts workout data
   - Calls Gemini with context about user's training plan and history
   - Returns structured feedback to motivate and guide the runner

3. **Strava Integration**:
   - OAuth flow: `/api/strava/auth` → redirect to Strava → `/api/strava/callback`
   - Handles token storage and workout auto-sync (currently in development)

4. **Training Plans**:
   - `lib/plan-templates.ts` contains templates for 5K, 10K, Half Marathon, Marathon, 50K
   - Each plan has predefined sessions (easy runs, tempo, long runs, etc.)
   - Plans are stored in Supabase and can be personalized per user

5. **Client State**:
   - Zustand store for user session, current plan, and UI state
   - Authentication state managed by Supabase session

## Development Guidelines

### TypeScript & Type Safety

- **Strict mode enabled**: All code must have explicit types
- **Path aliases**: Use `@/` to import from `src/` (configured in `tsconfig.json`)
- **Database types**: `src/types/database.ts` auto-generated from Supabase schema
- **Domain types**: Custom types in `src/types/index.ts` for business logic (User, TrainingPlan, Session, etc.)

### Styling

- **Tailwind-first**: Use Tailwind utility classes for all styling
- **Custom properties**: Theme values (colors, spacing) are defined as CSS custom properties in `src/app/globals.css`
- **Dark mode**: Built-in dark mode support via `dark:` classes

### API Routes

- **Route handlers**: Use Next.js `route.ts` pattern in `src/app/api/`
- **Auth**: Leverage Supabase session from request context for server routes
- **Error handling**: Return appropriate HTTP status codes and error messages

### Component Patterns

- **Server Components**: Default in Next.js 16; use for data fetching and business logic
- **Client Components**: Mark with `'use client'` only when needed for interactivity (useState, effects, etc.)
- **Props typing**: All component props must be explicitly typed with TypeScript interfaces

## Testing

No automated test suite is configured. Manual testing checklist before submitting changes:

- [ ] Load the page and verify core flows (login, onboarding, viewing plan, logging sessions)
- [ ] Test mobile responsiveness (narrow viewport)
- [ ] Verify dark/light theme switching
- [ ] Check Supabase connectivity and data persistence
- [ ] Test any new API endpoints manually (use curl or Postman)
- [ ] Verify authentication flows (sign up, sign in, sign out)

## Environment Setup

The `.env.local` file contains:

```
NEXT_PUBLIC_SUPABASE_URL=...          # Supabase project URL (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...     # Supabase anonymous key (public)
GEMINI_API_KEY=...                    # Google Gemini API key (secret)
STRAVA_CLIENT_ID=...                  # Strava OAuth client ID (optional)
STRAVA_CLIENT_SECRET=...              # Strava OAuth secret (secret)
NEXT_PUBLIC_STRAVA_REDIRECT_URI=...   # Strava callback URL (public)
```

## Common Development Patterns

### Fetching Data from Supabase

```typescript
// Server component
const supabase = createClient();
const { data, error } = await supabase
  .from('training_plans')
  .select('*')
  .eq('user_id', userId);
```

### Calling AI Feedback API

```typescript
const response = await fetch('/api/ai/feedback', {
  method: 'POST',
  body: JSON.stringify({ workoutData, userId })
});
const feedback = await response.json();
```

### Type-safe Database Queries

Use types from `src/types/database.ts` (auto-generated from Supabase schema) when querying. Create domain-specific types in `src/types/index.ts` for component props and business logic.

## Root Project (`index.html`)

- Single-file web app with inline HTML, CSS (custom properties + Tailwind), and JavaScript
- External dependencies loaded via CDN (Tailwind CSS, `marked` library)
- No build step required; runs directly in a browser or via `python3 -m http.server`
- Keep all related changes grouped and clearly labeled within the file
- Use 4-space indentation and semantic HTML
- Prefer Tailwind classes for styling; use CSS custom properties (`:root`/`.dark`) for theme-level values
- See `AGENTS.md` for detailed guidelines on maintaining this file

## Commit & PR Guidelines

- Use short, imperative subject lines (e.g., "Add AI feedback endpoint", "Fix plan template validation")
- Include a brief description of what changed and why
- For UI changes, include screenshots in PR description
- Keep diffs focused; avoid large refactoring in the same commit as feature additions
- Prefer incremental edits over large rewrites
