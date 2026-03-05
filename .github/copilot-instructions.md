# Project Guidelines

## Build And Run

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Production build: `npm run build`
- Preview build output: `npm run preview`
- Deploy static build to GitHub Pages: `npm run deploy`
- Test command is not configured in `package.json`; do not assume automated tests exist.

## Architecture

- This is a Vite + React + TypeScript single-page app.
- `src/App.tsx` is the shell: top-level header actions, language toggle, tab navigation, and per-tab component rendering.
- Global state is centralized in a single persisted Zustand store: `src/store/useStore.ts`.
- Domain tabs are split into focused components under `src/components/` (dashboard, global stats, feathers, accessories, gear, calculator).
- Supabase integration is in `src/lib/supabase.ts`, with auth/sync flows in `src/components/Auth.tsx` and `src/components/SubmitResultsButton.tsx`.
- Shared domain types/constants are defined in `src/types/index.ts`.

## Conventions

- Keep business logic in the store when possible; UI components should mostly call store actions and render derived values.
- Reuse shared types from `src/types/index.ts` and avoid redefining unions like language, tab, quality, or stone levels.
- Localization uses `tr(language, key)` from `src/i18n.ts`; new user-facing text should be added to the dictionary with both `uk` and `en` entries.
- Preserve existing naming and persisted state shape unless migration logic is added in `importData`.
- Use Tailwind utility classes consistent with existing design tokens (`aion-*` classes used throughout components).

## Pitfalls

- `src/lib/supabase.ts` throws at module load when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing. Any code importing Supabase-dependent components can fail fast without these env vars.
- State is persisted under the key `aion-enchant-tracker`; schema changes should include backward compatibility in `importData`.
- Export/import format includes `version`; maintain compatibility with v1 and legacy feather-only payloads already supported in `importData`.

## Key Files

- `src/App.tsx`: app composition and tab routing.
- `src/store/useStore.ts`: domain state, actions, persistence, import/export logic.
- `src/i18n.ts`: translation dictionary and keys.
- `src/types/index.ts`: canonical domain types and constants.
- `src/lib/supabase.ts`: environment-bound Supabase client setup.
- `supabase/schema.sql`: backend table/schema definitions for synced attempt data.
