# QA Handoff — Stride App Feature Implementation

**Date:** 2026-04-29 (bugs fixed same day)
**Branch:** `main`
**App:** `stride-app/` (Next.js, runs on `http://localhost:3000`)
**Setup:** `cd stride-app && npm install && npm run dev` (requires `.env.local` with Supabase + Gemini keys)

---

## Bug Fixes Applied After Initial QA Review

Six bugs were found during QA review and fixed before this handoff. See the [Files Modified](#files-modified) table for the complete change list.

| # | Severity | Area | Description |
|---|---|---|---|
| 1 | Critical | Task 1 & 2 | Modal closed before user saw AI feedback — `handleSessionSaved` was calling `setSelectedSession(null)`, unmounting the modal instantly. Fixed: teardown now happens only when the user taps "Start Rest & Recovery". |
| 2 | Moderate | Task 3 | "Total KM (Week)" stat card was showing all-time km total instead of current week. Fixed: stat now shows current ISO week km only, relabelled "This Week's KM". |
| 3 | Minor | Task 3 | ISO week formula was off by one (e.g. April 28 → W17 instead of W18) and returned W00 for Jan 1. Fixed: correct ISO 8601 algorithm anchored on the Thursday of each week. |
| 4 | Minor | Task 3 | Null `feel_rating` values defaulted to 4 in averages, skewing trend badges. Fixed: null feel ratings are now filtered out of all averages. |
| 5 | Minor | Task 5 | Entering `0` for a numeric field (e.g. Current Weekly km) stored `null` instead of `0` due to `Number(value) \|\| null`. Fixed: now stores `0` correctly. |
| 6 | Minor | Task 5 | Settings save showed "Saved!" even when the Supabase update failed (no error handling). Fixed: errors are now caught and displayed as a red message below the save button. |
| 7 | Minor | Task 2 | Re-logging a completed session incremented the progress counter a second time. Fixed: counter increment is skipped if the session was already `completed`. |

---

## What Was Implemented

Five features were completed. Test them in order — Tasks 1 and 2 must be tested together since Task 2 depends on Task 1's callback.

---

## Task 1 & 2 — Session Logging + Plan Page Refresh

**What it does:** Logging a session persists a `workout_logs` row and marks the session `completed`. The plan page reflects this instantly without a page reload.

**How to test:**
1. Sign in and navigate to `/plan`
2. Find any pending session and tap **"Log This Session"**
3. Fill in Distance (km), Duration (min), and optionally HR and Notes. Set a Feel rating
4. Tap **"Save & Get Feedback"** — the modal should switch to the AI feedback panel (Coach Stride says:)
5. Read the feedback, then tap **"Start Rest & Recovery"** to close

**Expected results:**
- The AI feedback panel must appear and stay visible until you dismiss it — the modal must NOT close automatically after saving
- The session card you just logged should immediately show a green completion checkmark — no page reload
- The overall progress circle (`X / Y Sessions`) should increment by 1
- If all sessions in a week are now complete, the week tab should turn green
- In Supabase → `workout_logs` table: verify a new row exists with `session_id`, `distance_meters`, `duration_seconds`, `feel_rating`, `ai_feedback` populated
- In Supabase → `sessions` table: verify that row's `status` changed to `'completed'`

**Edge cases to verify:**
- Submit with blank Distance and Duration — should still save (nullable fields), no crash
- Submit with blank HR — `avg_heart_rate` should be `null` in DB, not `0`
- Tap "Cancel" instead of submitting — no DB row should be created
- Log the same session a second time — a second `workout_logs` row will be created (expected; no unique constraint), but the progress counter (`X / Y Sessions`) must NOT increment again

---

## Task 3 — Dashboard Real Weekly Stats

**What it does:** The dashboard chart groups workouts by ISO calendar week. The trend badges are calculated from real data. The "Coach Insight" text comes from the AI coaching philosophy stored during onboarding.

**Prerequisite:** At least one logged session (Task 1) must exist; two weeks of logs are needed to see trend percentages.

**How to test:**
1. Navigate to `/dashboard`
2. With no logged sessions: chart should be empty, stat cards show 0, Coach Insight shows *"Log your first session to get personalized coach insights here!"*
3. After logging sessions (Task 1), return to dashboard and refresh
4. Chart X-axis should show week labels (e.g. `W18`, `W19`) — verify the label matches the actual current ISO week number
5. Trend badges (e.g. `+8%`, `-3%`) should only appear once you have logs in at least two different ISO weeks

**Expected results:**
- The **"This Week's KM"** stat card shows only the current calendar week's volume, not an all-time total
- Each chart point represents one ISO week's total km and average feel
- Trend badge is green for positive, red for negative
- If only one week of data exists, trend badges should be absent (not `+0%`)
- Sessions with no feel rating set do not inflate or deflate the average feel stat
- Coach Insight block shows the coaching philosophy text set during onboarding (cross-reference `training_plans.ai_adjustments` in Supabase for the `philosophy` entry)

---

## Task 4 — AI Chat Context Injection

**What it does:** The floating AI coach chat widget receives the user's profile, active plan, and last 5 workout logs as context. Responses reference the user's actual plan and recent sessions.

**Prerequisite:** A logged-in user with an active plan. More meaningful with logged sessions (Task 1).

**How to test:**
1. Navigate to `/plan` (or `/dashboard`) and open the AI coach chat widget (floating button, bottom-right)
2. Ask context-aware questions:
   - *"How am I doing this week?"*
   - *"What should I focus on for my next run?"*
   - *"How much weekly mileage am I doing?"*
3. The coach should respond using your name, reference your plan name, distance goal, and/or recent workout data

**Expected results:**
- Responses mention the user's name (if set in profile) or plan name
- References to "your half marathon plan" / "your recent easy run" / feel ratings are present
- Multi-turn conversation maintains context (ask a follow-up question referencing the previous reply)
- If Gemini API key is missing: returns the offline fallback message — no crash

**Regression check:**
- Unauthenticated session (sign out, visit a page with the chat widget) — should still work, returning generic coaching responses without crashing

---

## Task 5 — Settings Profile Editing

**What it does:** The Settings page has a full profile editing form.

**How to test:**
1. Navigate to `/settings`
2. Verify the form loads pre-filled with values from your profile (set during onboarding)
3. Change one or more fields (e.g. update Current Weekly km, change Experience Level)
4. Tap **"Save Profile"** — button should show "Saving..." then "Saved!" for ~3 seconds
5. Refresh the page — verify the updated values are still shown (persisted)
6. In Supabase → `profiles` table: confirm the row reflects your changes

**Edge cases to verify:**
- Clear a number field (e.g. Age) and save — should store `null` in DB
- Enter `0` for Current Weekly km and save — should store `0` in DB, not `null`
- Save with no Display Name — should store `null`, not an empty string
- Simulate a save failure (e.g. disconnect network, then save) — a red error message should appear below the button; no false "Saved!" confirmation
- Navigate away mid-edit without saving — no auto-save, changes are discarded (expected)

---

## Regression Checklist

These existing flows should be unaffected:

- [ ] Sign up / sign in / sign out
- [ ] Onboarding wizard (all 4 steps, plan generation)
- [ ] Plan page loads with correct sessions and week tabs
- [ ] Session cards expand/collapse
- [ ] Strava connect button in Settings still links to `/api/strava/auth`
- [ ] Dark/light theme on all modified pages

---

## Known Non-Issues

- `next build` fails with a Supabase prerender error on `/dashboard` when run without `.env.local` — pre-existing environment configuration issue, not a code regression. Dev mode (`npm run dev`) works correctly.
- Logging a session twice creates two `workout_logs` rows — there is no unique constraint on `session_id` by design. The progress counter will correctly not double-increment.

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/LogSessionModal.tsx` | DB insert to `workout_logs`, session status update, `onSaveSuccess` callback |
| `src/app/plan/page.tsx` | Optimistic state update; teardown moved to "Start Rest & Recovery"; double-count guard |
| `src/app/dashboard/page.tsx` | ISO-week grouping (corrected formula), current-week km stat, null-safe feel averages, dynamic coach insight |
| `src/app/api/ai/chat/route.ts` | Server-side context injection (profile + plan + recent logs) into Gemini prompt |
| `src/app/settings/page.tsx` | Full profile editing form; error handling on save; `0` stored correctly for numeric fields |
| `src/types/index.ts` | Fixed pre-existing TypeScript error (`SessionWithWorkout` uses `Omit`) |
