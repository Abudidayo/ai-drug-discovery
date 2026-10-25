/**
 * A failed API call. `status` is the HTTP status, or 0 when the API could not be reached at all.
 * `detail` is the API's own plain-words reason when it sent one.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string | null;

  constructor(status: number, detail: string | null) {
    super(detail ?? (status === 0 ? "The API could not be reached." : `HTTP ${String(status)}`));
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  get unreachable(): boolean {
    return this.status === 0 || this.status >= 500;
  }
}

function detailOf(body: unknown): string | null {
  if (typeof body === "object" && body !== null && "detail" in body) {
    const { detail } = body;
    if (typeof detail === "string") return detail;
  }
  return null;
}

interface FetchResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/**
 * Turns an openapi-fetch call into data or an `ApiError`. A request that never reached the API
 * (offline, server down, proxy error without a body) becomes status 0.
 */
export async function unwrap<T>(call: Promise<FetchResult<T>>): Promise<T> {
  let result: FetchResult<T>;
  try {
    result = await call;
  } catch {
    throw new ApiError(0, null);
  }
  const { data, error, response } = result;
  if (response.ok && data !== undefined) return data;
  throw new ApiError(response.status, detailOf(error));
}
