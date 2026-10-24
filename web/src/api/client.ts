import createClient from "openapi-fetch";
import type { paths } from "./schema";

/**
 * The typed API client. Paths and payloads come from `schema.d.ts`, generated from the API's
 * committed OpenAPI contract (`npm run gen:api`). In development Vite proxies `/api` to FastAPI.
 */
export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE ?? "/api",
});
