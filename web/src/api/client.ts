import createClient from "openapi-fetch";
import type { paths } from "./schema";

/**
 * Where the API lives. The contract's paths already start with `/api`, so this is an origin, not
 * a path: by default the page's own origin, which Vite proxies to FastAPI in development and
 * preview. `VITE_API_BASE` points the app at an API on another origin.
 */
const apiOrigin = import.meta.env.VITE_API_BASE ?? window.location.origin;

/**
 * The typed API client. Paths and payloads come from `schema.d.ts`, generated from the API's
 * committed OpenAPI contract (`npm run gen:api`).
 *
 * `fetch` is looked up on every request rather than captured once, so test doubles installed
 * after this module loads (MSW) still see the requests.
 */
export const api = createClient<paths>({
  baseUrl: apiOrigin,
  fetch: (request) => globalThis.fetch(request),
});

/** An API path the API itself handed out (such as a docking file's `url`), as a full URL. */
export function apiUrl(path: string): string {
  return new URL(path, apiOrigin).href;
}
