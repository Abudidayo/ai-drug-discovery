# Half Life website

The selected Keynote website runs independently of the API:

```sh
npm ci
npm run dev -- --config prototypes/vite.config.js --host 127.0.0.1 --port 5174 --strictPort
```

Open http://127.0.0.1:5174/prototypes/. For build and browser checks, see [ROUND_THREE.md](prototypes/ROUND_THREE.md). The copied app scaffold and demo fixtures support this exploration; the website does not execute live experiments or model calls.

The underlying application setup is documented below.

# web

The React app: Vite, React 19 and TypeScript (strict). It follows the "Figure" design in
[`docs/design.md`](../docs/design.md), which is binding.

## Run it

Needs Node 22.22 or later.

```sh
npm ci
npm run dev        # http://localhost:5173, with /api proxied to FastAPI on 127.0.0.1:8000
```

| Script                    | What it does                                                                 |
| ------------------------- | ---------------------------------------------------------------------------- |
| `dev`                     | Vite dev server with the `/api` proxy                                        |
| `build`                   | Type-checks, then builds to `dist/`                                          |
| `preview`                 | Serves `dist/` (also proxies `/api`)                                         |
| `typecheck`               | `tsc -b`                                                                     |
| `lint`                    | ESLint (typescript-eslint, react-hooks, jsx-a11y), no warnings allowed       |
| `format` / `format:check` | Prettier                                                                     |
| `test`                    | Vitest with jsdom, Testing Library and MSW                                   |
| `e2e`                     | Playwright: starts the fixture API and `vite preview`, walks steps 1-6 and 8 |
| `gen:api`                 | Regenerates `src/api/schema.d.ts` from `../api/openapi.json`                 |

`VITE_API_BASE` sets the API's origin (default: the page's own origin, whose `/api` Vite proxies).
`OXHACK_API_ORIGIN` points the dev and preview proxies at an API other than
`http://127.0.0.1:8000`.

`npm run e2e` needs `uv` (it runs `uv run uvicorn oxhack_api.app:app` in `../api` with
`OXHACK_FIXTURE_DELAY_MS=300`) and Playwright's Chromium (`npx playwright install chromium`).
Locally it reuses servers already running on ports 8000 and 4173; `E2E_API_PORT` and
`E2E_WEB_PORT` move them.

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
  `src/api/queries.ts` holds the TanStack Query hooks: debounced disease search, creating an
  Experiment, the Experiment (polled every second while it builds, every two while its jury or a
  docking job works), asking the jury, history with archive and restore, the prepared structures
  and molecule conformers.
- `src/app/routes/ExperimentLayout.tsx`: `/e/:experimentId/:step` loads the Experiment once,
  shows its build progress or failure, and owns the figure grid and the persistent protein
  network, so the network is mounted once and survives step changes. Each step
  (`src/steps/`) only adds its own panels and points the network at what it is about.
- `src/three/`: the print-style WebGL plates (`NetworkFigure`, `MoleculeFigure`), loaded lazily.
  Drag rotates; ambient rotation and easing stop under `prefers-reduced-motion`. `MoleculeStrip`
  draws Compare's molecules side by side on one shared canvas, so a step never needs more than
  three WebGL contexts (the hidden network keeps its own).
- `src/charts/SlopeChart.tsx`: closeness, network rank and evidence rank on one row per drug.
- `src/charts/DotPlot.tsx`: the Model jury, one row per drug and one marker shape per model
  (`Marker.tsx`), with a split decision drawn once in the contested colour. `src/lib/jury.ts`
  picks the rows, the counted models and the one objection shown.
- `src/lib/format.ts`: `drugName()` and the other display formatters; use them everywhere.
- Tests: `src/test/` has the MSW server (handlers typed by the contract via `openapi-msw`), the
  WebGL and layout stand-ins for jsdom, and fixtures read straight from
  `../api/oxhack_api/fixtures` through the `@api-fixtures` alias, so both sides share one copy.
  `e2e/` holds the Playwright tests.

ArrowUp and ArrowDown move between steps, except while typing in a field.

`3dmol` is installed for the binding pose (phase 7) but not used yet.
