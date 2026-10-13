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
- `interactive.js`: questions, quizzes, progression, coins, and paid hints.
- `assets/chapter-1.pdf`, `assets/chapter-2.pdf`: current local reading material.
- `assets/mathjax-tex-svg.js`: bundled mathematical typesetting engine.
- `assets/fonts/`: bundled Assistant and Frank Ruhl Libre web fonts (SIL Open Font License; licenses alongside).
- `assets/coin.svg`: coin icon used for the coin counter, hint prices and awards. Replace this one file to change the coin artwork.
- `build_notes.py`: renders PDFs and generates the static site in `_site/`.

The local copy contains two chapter PDFs. Do not assume all chapters or all
interactive content are complete. Progress and coins are stored in the visitor's
browser. Moving to another browser or origin does not transfer that progress.
Homework file selection is present; an automatic AI grading service is not
connected yet.

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
