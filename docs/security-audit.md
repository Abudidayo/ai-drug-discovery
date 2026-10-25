# Security review - 25 October 2026

This is a source review and targeted regression audit for the hackathon app. It
covers the HTTP API, browser client, persistence, paid model calls, docking
worker, upstream data clients and deployment configuration. It is not a claim
that the application cannot crash, or a substitute for a deployed penetration
test. No paid model calls or live destructive tests were made.

## Findings and changes

| Severity | Finding | Change |
| --- | --- | --- |
| High | Experiment history and object endpoints had no browser ownership boundary. Anyone reaching the API could retrieve another browser's experiments. | Random, HttpOnly browser cookie; hashed ownership in the repository; ownership enforced for experiments and child operations. Existing unowned experiments cannot be safely assigned to their original users. |
| High | Public create, jury and docking operations could consume shared CPU, storage and paid API credentials without application quotas. | Browser/IP request limits, work quotas, shared Postgres budget counters and explicit Cortex request/output budgets. Quotas reject excess work; they do not guarantee a particular cloud bill. |
| Medium | Requests could occupy excessive concurrent API capacity or submit unnecessarily large bodies. | Bounded request admission and body size at the HTTP boundary. |
| Medium | Cookie-authenticated mutations needed a cross-site request boundary. | SameSite cookie and origin/fetch-site checks for mutations. |
| Medium | Paid chat completions relied on the provider's default output limit; Claude's limit scaled without an application ceiling. | Explicit maximum of 32,768 output tokens per chat completion; Claude retains its candidate-dependent allowance with the same ceiling. Retried requests consume separate call budget. |
| Medium | A malformed PubChem SDF could raise an uncaught exception or cache invalid atom references. Readers could observe a partially written conformer cache file. | Validate format, counts, finite coordinates and bond references; report upstream unavailability; replace cache entries atomically. |
| Medium | Concurrent experiments wrote shared evidence cache entries through one temporary filename, allowing a competing atomic rename to fail. | Each writer uses a unique temporary file, atomically replaces the cache entry and cleans up its own temporary file. |
| Low | Docking error reporting loaded all of stderr into memory before returning its last lines. | Read only a bounded byte suffix before decoding. Existing subprocess timeout, process-group termination and scratch cleanup remain in use. |

CI and deployment reliability changes are tracked with their workflow changes.
In particular, database migration failures must stop deployment instead of being
hidden by a shell pipeline.

## Default limits and rollout

The API allows 240 requests/minute/browser, 720/minute/IP and 30 mutations/minute/IP.
New experiments are limited to 6/hour/browser, 18/hour/IP and 100/day globally.
Jury admission is limited to 3/hour/browser and 9/hour/IP. Repeated follow-ups
reuse the existing jury. Every actual Cortex attempt, including retries and worker
recovery, reserves from shared limits of 12/minute and 180/day before the provider
is called. Direct research CLI commands are outside these application counters.
The configurable limits are listed in `.env.example`.

Bodies are limited to 16 KiB, active API requests to 32, pending/running jobs to
64, new docking computations to 200/day and docking records to 60/experiment.
The database pool has at most 32 waiters with a five-second acquisition limit;
statements time out after 15 seconds and lock waits after five seconds. Excess
requests return 429 with `Retry-After`; exhausted queues and unavailable databases
return safe 503 responses. Application health checks remain available under load.
Some reverse proxies hide client addresses, so browsers behind them share IP quotas.

Migration `0009_anonymous_sessions.sql` must be applied before starting this
version against Postgres. Deploy scripts run `uv run db/migrate.py` and abort on
failure. Previously saved experiments without ownership remain stored but hidden
from browser sessions. After the review, migration 0009 was applied to the
configured `oxhack` database at the user's request; the migration record, ownership
column, quota table and indexes were verified. No application deployment was performed.

## Checks and evidence

- `npm audit --json`: zero reported vulnerabilities across the web dependency tree.
- `pip-audit` against pinned, exported runtime dependencies from `uv.lock`: zero
  known vulnerabilities reported. The separate pinned docking toolchain in
  `.devcontainer/docking-requirements.txt` also returned zero known vulnerabilities.
  Optional platform-specific dependencies that
  do not apply to the audit host are outside this result. Audit results are a
  point-in-time database check, not proof every package is safe.
- Tracked-file secret-signature scan found no matching private-key, GitHub-token,
  AWS-access-ID or OpenAI-key signatures. Values were never printed. Git history,
  running service environment and third-party account permissions were not
  exhaustively audited.
- Inspected SQL construction: runtime Postgres values use query parameters and
  composed identifiers; observed dynamic LISTEN channel is an application
  constant. No user-controlled SQL injection was established in the reviewed paths.
- Inspected file serving: job IDs are UUIDs and result filenames use an allowlist.
  Arbitrary filesystem paths are not accepted by the result-download endpoint.
- Reviewed outbound runtime requests: public inputs select identifiers on fixed
  provider hosts; no arbitrary-URL fetch endpoint was found. Snowflake account
  identifiers are validated before constructing the provider hostname.
- No `eval`, `shell=True`, `innerHTML` or `dangerouslySetInnerHTML` runtime sink
  was found in indexed application code. React text rendering provides escaping;
  this does not independently prove all browser dependencies are XSS-free.
- Conformer regression tests reproduce invalid upstream content and invalid bond
  references, then verify safe failure without caching. All 14 molecule tests,
  all 8 docking-runner tests and all 148 offline jury-client tests passed during
  this review. Molecule typechecking and targeted lint passed. Broader integrated
  checks are recorded with the final change validation.
- The chat completion limit field was checked against the installed SDK and the
  [official Snowflake REST API reference](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api).
  Provider model limits still apply.

## Operational boundaries

Anonymous cookies isolate browser profiles, not human identities. People sharing
one browser profile share its history. Clearing the cookie, using private browsing
or switching devices loses access to that browser's history. A stolen cookie acts
as that browser's credential. Serve the app over HTTPS and require Secure cookies
in production. Keep database and provider credentials on the server.

Postgres is required for durable, shared work and paid-call quotas. Memory mode
loses its counters and data on restart. HTTP burst and active-request limits are
per API process; before scaling to multiple public replicas, place a shared edge
limiter in front of the API. Configure trusted proxy handling so the application
sees the actual peer IP without trusting spoofed forwarding headers.

A distributed attack can rotate IPs and cookies, and fixed-window limits allow
bursts at window boundaries. Public hosting still needs edge traffic protection,
provider account spending limits, resource limits, disk monitoring and retention
for old experiments, result files and upstream caches. Application admission limits
do not stop network saturation, native-library crashes, out-of-memory failures,
slow upstream providers or exhausted storage. Operational recovery, backups and
provider-side budget alerts remain deployment responsibilities.
