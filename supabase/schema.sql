-- Supabase foundation for the Calculus 1A interactive course.
-- Run in a new Supabase project after enabling Auth.

create table if not exists public.avatars (
  id text primary key,
  display_name text not null,
  symbol text not null,
  accent text not null,
  description text not null,
  sort_order integer not null default 0
);

insert into public.avatars (id, display_name, symbol, accent, description, sort_order)
values
  ('noether', 'אמי נתר', 'N', 'algebra', 'מבנים וסימטריות', 10),
  ('germain', 'סופי ז׳רמן', 'S', 'prime', 'ראשוניות ואומץ', 20),
  ('gauss', 'גאוס', 'Σ', 'sum', 'סדר וחישוב', 30),
  ('cauchy', 'קושי', 'ε', 'epsilon', 'דיוק וגבולות', 40),
  ('riemann', 'רימן', 'ζ', 'zeta', 'מרחב ופונקציות', 50),
  ('cantor', 'קנטור', 'ℵ', 'infinity', 'קבוצות ואינסוף', 60),
  ('weierstrass', 'ויירשטראס', 'δ', 'delta', 'פורמליות נקייה', 70),
  ('hypatia', 'היפטיה', 'H', 'classic', 'למידה וסקרנות', 80)
on conflict (id) do update set
  display_name = excluded.display_name,
  symbol = excluded.symbol,
  accent = excluded.accent,
  description = excluded.description,
  sort_order = excluded.sort_order;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  avatar_id text not null references public.avatars(id),
  role text not null default 'student' check (role in ('student', 'staff', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.unit_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null default 'calculus-1a',
  chapter_id text not null,
  unit_id text not null,
  passed boolean not null default false,
  best_score integer,
  mistakes integer,
  total_questions integer,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id, chapter_id, unit_id)
);

create table if not exists public.question_attempts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  course_id text not null default 'calculus-1a',
  chapter_id text not null,
  unit_id text not null,
  topic text not null,
  selected_answer integer,
  correct boolean not null,
  had_mistake boolean not null,
  first_answer_ms integer not null default 0,
  attempts integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.coin_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  course_id text not null default 'calculus-1a',
  unit_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.hint_purchases (
  user_id uuid not null references auth.users(id) on delete cascade,
  hint_id text not null,
  cost integer not null default 5,
  purchased_at timestamptz not null default now(),
  primary key (user_id, hint_id)
);

create table if not exists public.homework_submissions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  homework_id text not null,
  file_path text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'checking', 'feedback_ready', 'needs_review', 'failed')),
  feedback jsonb,
  submitted_at timestamptz not null default now(),
  checked_at timestamptz
);

alter table public.avatars enable row level security;
alter table public.profiles enable row level security;
alter table public.unit_progress enable row level security;
alter table public.question_attempts enable row level security;
alter table public.coin_events enable row level security;
alter table public.hint_purchases enable row level security;
alter table public.homework_submissions enable row level security;

create policy "avatars are public"
on public.avatars for select
using (true);

create policy "users read own profile"
on public.profiles for select
using (auth.uid() = user_id);

create policy "users insert own profile"
on public.profiles for insert
with check (auth.uid() = user_id);

create policy "users update own profile"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users read own progress"
on public.unit_progress for select
using (auth.uid() = user_id);

create policy "users write own progress"
on public.unit_progress for insert
with check (auth.uid() = user_id);

create policy "users update own progress"
on public.unit_progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users read own attempts"
on public.question_attempts for select
using (auth.uid() = user_id);

create policy "users insert own attempts"
on public.question_attempts for insert
with check (auth.uid() = user_id);

create policy "users read own coins"
on public.coin_events for select
using (auth.uid() = user_id);

create policy "users insert own coin events"
on public.coin_events for insert
with check (auth.uid() = user_id);

create policy "users read own hint purchases"
on public.hint_purchases for select
using (auth.uid() = user_id);

create policy "users insert own hint purchases"
on public.hint_purchases for insert
with check (auth.uid() = user_id);

create policy "users read own submissions"
on public.homework_submissions for select
using (auth.uid() = user_id);

create policy "users insert own submissions"
on public.homework_submissions for insert
with check (auth.uid() = user_id);

