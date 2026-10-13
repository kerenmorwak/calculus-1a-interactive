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

## Phase 3: server-backed progress

Move these local progress fields to Supabase:

- passed units
- first-answer mistakes
- quiz scores
- question topic statistics
- coin events
- purchased hints

Keep `localStorage` only as a temporary cache so the interface stays fast.

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

Use a small curated bank of mathematician-inspired avatars. They should feel
academic and warm, not childish. The first set is:

- Noether
- Germain
- Gauss
- Cauchy
- Riemann
- Cantor
- Weierstrass
- Hypatia

