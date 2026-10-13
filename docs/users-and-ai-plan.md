# Users, Progress, and AI Review Plan

## Phase 1: local profile foundation

The current site now has a lightweight learner profile:

- nickname
- mathematician avatar
- local learner id

This is intentionally local-first. It lets us shape the product experience before
connecting real authentication.

## Phase 2: real login

Use Supabase Auth first:

- Google sign-in or email magic link
- profile row per authenticated user
- row-level security so each learner sees only their own progress

The schema lives in `supabase/schema.sql`.

The frontend now has an optional Supabase bridge:

- `runtime-config.js` holds the public Supabase URL and anon/publishable key.
- `auth.js` shows login only when those values exist.
- Profile, learning state, coins, purchased hints, unit progress, and question
  attempt summaries sync to Supabase after sign-in.
- Without config, the course remains local-first and keeps working.

## Phase 3: server-backed progress

Move these local progress fields to Supabase:

- passed units
- first-answer mistakes
- quiz scores
- question topic statistics
- coin events
- purchased hints

Keep `localStorage` only as a temporary cache so the interface stays fast.

Current sync status:

- profile: implemented
- full local progress snapshot: implemented
- unit completion / quiz score summary: implemented
- question attempt summaries: implemented
- coin ledger and purchased hints: implemented
- scanned homework uploads and AI feedback: planned

## Phase 4: personalized practice

Do not ask AI to improvise live questions for students. Use a reviewed question
bank with metadata:

- course id
- chapter id
- unit id
- topic
- subtopic
- difficulty
- prerequisite units
- common misconception

The app can choose reinforcement questions from this bank using mistakes and
answer time.

## Phase 5: scanned homework review

This is where the OpenAI API belongs:

1. Learner uploads a PDF or images.
2. The file is stored in Supabase Storage.
3. A server function sends the file to OpenAI with a strict grading rubric.
4. The returned feedback is stored in `homework_submissions.feedback`.
5. The site shows the saved feedback.

Never put the OpenAI API key in browser code. It must live only in a server
function or another trusted backend.

## Avatar direction

Use a small curated bank of mathematician avatars: flat illustrated portraits
inspired by each mathematician's era and look (not likenesses), shown with
their years. They are drawn by `tools/make_avatars.py`. They should feel academic and warm,
not childish. The current set (ids must match `supabase/schema.sql`):

- Noether, Gauss, Germain, Cauchy
- Kovalevskaya, Riemann, Hypatia, Euler
- Cantor, Archimedes, Weierstrass, Dedekind

## Sign-in and profile behaviour

- Without Supabase config: no sign-in button; nickname, avatar and progress
  stay on the device. The profile picker is offered once on the first visit;
  "לא עכשיו" is remembered.
- With config, signed out: a "כניסה" button sends an email link.
- First sign-in, account has a profile: the account profile is used.
- First sign-in, account has none but the device does: the learner is asked
  whether to save the device profile to the account.
- First sign-in, nothing anywhere: the profile picker opens.
- Progress from the device and the account is merged: a sub-unit passed on
  either side stays passed, bought hints are kept, and the coin balance is the
  larger of the two. Progress left on the device by a different account is not
  merged in.
- If the sign-in library cannot load, the button stays hidden and the course
  keeps working on the device.
