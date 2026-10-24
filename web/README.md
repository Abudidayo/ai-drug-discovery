# web

The React app: Vite, React 19 and TypeScript (strict). It follows the "Figure" design in
[`docs/design.md`](../docs/design.md), which is binding.

## Run it

Needs Node 22.22 or later.

```sh
npm ci
npm run dev        # http://localhost:5173, with /api proxied to FastAPI on 127.0.0.1:8000
```

| Script                    | What it does                                                           |
| ------------------------- | ---------------------------------------------------------------------- |
| `dev`                     | Vite dev server with the `/api` proxy                                  |
| `build`                   | Type-checks, then builds to `dist/`                                    |
| `preview`                 | Serves `dist/` (also proxies `/api`)                                   |
| `typecheck`               | `tsc -b`                                                               |
| `lint`                    | ESLint (typescript-eslint, react-hooks, jsx-a11y), no warnings allowed |
| `format` / `format:check` | Prettier                                                               |
| `test`                    | Vitest with jsdom and Testing Library                                  |
| `gen:api`                 | Regenerates `src/api/schema.d.ts` from `../api/openapi.json`           |

`VITE_API_BASE` sets where the client sends requests (default `/api`).

## Layout

- `src/styles/tokens.css`: every colour, type size and spacing step from `docs/design.md`, plus
  a small reset. Components use CSS Modules and read only these custom properties.
- `src/copy/en.ts`: the copy deck. Every interface sentence lives here. Text that depends on the
  Disease (evidence, objections, model names) comes from the API instead.
- `src/app/Shell.tsx`: header (product, Disease, step navigation, Back and Next), step title and
  intro, then the figure. `PageFrame.tsx` renders the disclaimer once on every screen.
- `src/app/routes.tsx`: `/` is step 1 before any Experiment; `/e/:experimentId/:step` uses the
  step slugs from the copy deck; anything else is not found.
- `src/api/client.ts`: the `openapi-fetch` client, typed by the generated `schema.d.ts`. Don't
  edit `schema.d.ts` by hand; run `npm run gen:api` after the API contract changes.

ArrowUp and ArrowDown move between steps, except while typing in a field.

`three` and `3dmol` are installed for the network and pose views but not used yet.
