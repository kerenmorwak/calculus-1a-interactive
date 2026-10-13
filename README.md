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

### Developer shortcuts

For local testing only, open the chapter with `?dev=1`:

```text
http://127.0.0.1:8000/?chapter=1&dev=1
```

This shows a small "development only" panel that can jump straight to the final
quiz or the homework submission area, and can clear local progress for a fresh
test. The panel is gated to `127.0.0.1`/`localhost` and does not appear on normal
links or hosted URLs. It updates only the local browser state and does not sync
those shortcut changes to Supabase.

## Source files

- `index.html`, `style.css`: page structure and styling.
- `app.js`: reading navigation and generated chapter metadata placeholder.
- `auth.js`: optional Supabase Auth and cloud progress bridge.
- `runtime-config.js`: runtime configuration. It is intentionally empty by
  default.
- `interactive.js`: progression, coins, paid hints, and the runtime loader for
  the question bank.
- `docs/question-bank.json`: source of truth for checks, final quiz questions,
  open writing practice, homework tasks, answers, hints, topics, difficulty
  levels, question layers, skills, and review status.
- `docs/question-bank.md`: readable review copy generated from the JSON. After
  editing the JSON, run `node tools/enrich_question_bank_metadata.mjs`, then
  `node tools/export_question_bank.mjs` to refresh it.
- `docs/question-bank-sources.md`, `docs/question-bank-manifest.json`: map the
  app question bank and the larger exam/homework archives that live outside the
  repository in `../output/`. Do not commit those heavy archives or ZIP files to
  the app repository.
- `docs/learning-design-plan.md`: pedagogical rules for question quality,
  logic practice, skill tracking, and future homework splits.
- `assets/chapter-1.pdf`, `assets/chapter-2.pdf`: current local reading material.
- `assets/mathjax-tex-svg.js`: bundled mathematical typesetting engine.
- `build_notes.py`: renders PDFs and generates the static site in `_site/`.

The local copy contains two chapter PDFs. Do not assume all chapters or all
interactive content are complete. Without login, progress, coins, paid hints,
and the current learner profile are stored in the visitor's browser. When
Supabase is configured and the learner signs in, those fields sync to the
account. Open writing practice is not checked or graded. Homework file
selection is present; an automatic AI grading service is not connected yet.

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

1. Run `supabase/schema.sql` in the Supabase SQL editor.
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
It includes a GitHub Pages workflow in `.github/workflows/deploy-pages.yml`.
After the workflow is merged to `main`, enable Pages in the repository settings
and choose **GitHub Actions** as the publishing source. The workflow builds
`_site/` with `python build_notes.py` and publishes the generated static site;
`_site/` itself stays out of Git.

After GitHub Pages gives the site URL, add that origin to Supabase Auth redirect
URLs. Email magic links use the current site origin as their return URL.

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
