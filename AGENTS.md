# Repository Guidelines

## Project Structure & Module Organization

- `index.html` is the application. It contains the markup, styling (custom CSS variables + Tailwind utility classes), and all client-side JavaScript.
- `README.md` is a short project description.
- There is currently no separate `src/`, `assets/`, or `tests/` directory—keep related changes grouped and clearly labeled within `index.html`.

## Build, Test, and Development Commands

This is a static, single-file web app.

- Run locally (recommended): `python3 -m http.server 8000` then open `http://localhost:8000/`.
- Quick open (no server): open `index.html` directly in a browser (some PWA features like the manifest may not behave the same via `file://`).

## Coding Style & Naming Conventions

- Indentation: 4 spaces; keep HTML/CSS/JS formatting consistent with the surrounding section.
- Prefer semantic HTML and descriptive `id`/`data-*` attributes when adding hooks for JavaScript.
- Keep UI styling primarily in Tailwind classes; use the CSS custom properties in `:root`/`.dark` for theme-level values.
- Use `const`/`let` (no `var`), and keep functions small and single-purpose.
- External dependencies are loaded via CDN (e.g., Tailwind and `marked`); keep URLs versioned and avoid introducing new dependencies unless necessary.

## Testing Guidelines

No automated test suite is configured. Before opening a PR, do a quick manual smoke test:

- Load the page and verify core flows (view plan, interactions, and any user inputs).
- Confirm persistence behavior if data is stored in `localStorage`.
- Check mobile responsiveness (narrow viewport) and dark/light theme behavior.

## Commit & Pull Request Guidelines

- Commits in this repo use short, imperative subjects (e.g., `Add index.html`). Keep messages concise and focused.
- PRs should include: a brief summary, what was changed and why, and screenshots for visible UI changes.
- Keep diffs minimal; avoid large reformat-only changes unless they are the purpose of the PR.

## Agent-Specific Notes

- Prefer incremental edits over large rewrites; keep the app runnable as a single `index.html` unless there’s a clear reason to split files.
