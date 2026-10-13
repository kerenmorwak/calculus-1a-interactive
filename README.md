# Interactive Calculus 1A

Independent working copy of the interactive Hebrew Calculus 1A course, based on
Shiri Artstein's notes at https://shiriartstein.github.io/Calculus-1-A/.
Notes and embedded images retain their original copyright. This copy does not
grant additional redistribution rights.

## Local preview

Use Python 3.12 or later. From this directory:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python build_notes.py
.venv/bin/python -m http.server 8000 --bind 127.0.0.1 --directory _site
```

Open http://127.0.0.1:8000. The build recreates `_site/` from the source files and
PDFs. Edit the source files, then rebuild; do not edit `_site/` directly.

## Source files

- `index.html`, `style.css`: page structure and styling.
- `app.js`: reading navigation and generated chapter metadata placeholder.
- `auth.js`: optional Supabase Auth and cloud progress bridge.
- `runtime-config.js`: runtime configuration. It is intentionally empty by
  default.
- `interactive.js`: questions, quizzes, progression, coins, and paid hints.
- `assets/chapter-1.pdf`, `assets/chapter-2.pdf`: current local reading material.
- `assets/mathjax-tex-svg.js`: bundled mathematical typesetting engine.
- `build_notes.py`: renders PDFs and generates the static site in `_site/`.

The local copy contains two chapter PDFs. Do not assume all chapters or all
interactive content are complete. Without login, progress, coins, paid hints,
and the current learner profile are stored in the visitor's browser. When
Supabase is configured and the learner signs in, those fields sync to the
account. Homework file selection is present; an automatic AI grading service is
not connected yet.

## Users and AI grading

The current implementation is local-first. It includes a lightweight learner
profile with a nickname and mathematician-inspired avatar so we can shape the
student experience before connecting real authentication.

The planned production path is documented in `docs/users-and-ai-plan.md`. The
initial Supabase database schema is in `supabase/schema.sql`; it covers Auth
profiles, synced learning state, progress, question attempts, coin events, hint
purchases, and scanned homework submissions. The OpenAI API key must live only
in a server function or trusted backend, never in browser JavaScript.

To enable login in a Supabase project:

1. Run `supabase/schema.sql` in the Supabase SQL editor. For a project that
   already ran an earlier version, run only the `insert into public.avatars`
   statement again so the new avatars exist.
2. Enable email magic-link authentication.
3. Add the hosted site URL and local preview URL to Supabase Auth redirect URLs.
4. Put the public project URL and anon/publishable key in `runtime-config.js`:

```js
window.CALCULUS_RUNTIME_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY"
};
```

The anon/publishable key is designed for browser use with row-level security.
Do not put a Supabase service-role key or an OpenAI API key in this file.

## Repository and access

This project has a separate **private** GitHub repository:
https://github.com/kerenmorwak/calculus-1a-interactive
It contains no automatic deployment workflow.

Repository access and hosted-site access are configured separately. Keep the
repository private, invite collaborators explicitly, and keep the hosted site
restricted to invited users. Sending a URL is not an access grant.

## Design work

Run and inspect the existing course before changing its presentation. Preserve
the mathematical content, Hebrew/left-to-right math handling, progression
rules, first-answer scoring, and coin accounting. A hint costs 5 coins once and
remains open after purchase. Do not present homework uploads as submitted or
graded without implementing the corresponding service.

Work on a separate branch and preview locally before changing the hosted site.
