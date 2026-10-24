# Model jury

Offline demonstration (all votes are explicitly labelled mock reviews):

```sh
.venv/bin/python -m jury fixtures/evidence_packet.json --out /tmp/jury-mock.json --mock
```

Live use requires `SNOWFLAKE_ACCOUNT` (account identifier only), `SNOWFLAKE_PAT`,
and `SNOWFLAKE_MODELS` (a JSON array of three pinned IDs from distinct model
families, verified in your account). No live IDs are hardcoded. The mock IDs in
`config.json` cannot be used by the live CLI. `--config path.json` overrides the
remaining fixture-shaped settings. Availability, family diversity and cost must
be checked in the account before freezing an Experiment.

```sh
.venv/bin/python -m jury fixtures/evidence_packet.json --out /tmp/jury-live.json
.venv/bin/python -m pytest tests/jury -q
.venv/bin/python -m pytest tests/jury -q -m network
```

Requests default to a 300-second timeout for slower jurors such as GLM.
Set `SNOWFLAKE_TIMEOUT_SECONDS` or pass `--timeout 420` to override it;
`CortexModel(timeout=420)` provides the same override for Python callers.
The timeout must be positive and finite. It does not add retries.
The CLI creates the output directory before making model calls.

`jury.client.run_jury(packet, config, model_call)` accepts a callable with
`(model, prompt, temperature)` arguments returning the raw reply string.
`CortexModel` uses the OpenAI SDK as described in the
[Snowflake Cortex REST documentation](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api).
Retries reuse the same blinded prompt and order, with SDK retries disabled.
Requests include the review contract as `response_format: json_schema`.
Snowflake documents schema enforcement for OpenAI and Claude; other families
(including GLM) ignore this field. Every response still passes the same local
schema, rank, citation, safety and exact-number checks. A Markdown fence or prose
around exactly one JSON object is accepted; competing objects, arrays, duplicate
keys, malformed JSON and non-finite JSON numbers are rejected.
Failed calls record exception types only, since exception text can expose secrets.
An invalid reply yields no reviews; its last raw reply and per-attempt errors are
retained. If any reply arrived but none validated, the juror is invalid; failed
means every attempt failed to return a reply. Successful replies have null raw output.

Only the fixture allowlist enters the evidence payload. `rank` appears solely
in output instructions; input ranks and identifiers remain hidden. Candidate IDs
are restored using exact packet labels after validation. Numeric literals are
checked using exact decimal equality against cited evidence `values`; protein
identifiers such as JAK1, Bcl-2 and E12 are excluded from numeric parsing. Hyphen
and nonbreaking-hyphen typography is normalized for packet identifiers only;
invented identifiers still have their numbers checked. Structural
checks do not establish biological truth; reasoning still needs manual audit.

Consensus excludes every invalid or failed juror. Equal Borda totals share the
higher rank, with labels in numerical order for deterministic display. No valid
jurors produces an empty ranking. Kendall's W is null with fewer than two valid
jurors or fewer than two Candidates (its denominator is zero). Each juror's
shuffle uses `shuffle_seed + its configuration index`; independent shuffles may
coincidentally match, particularly for small panels. Mock consensus has no
scientific meaning and must remain labelled when displayed.

`tests/jury/data/live_recording.json` preserves the supplied 2026-10-24 pilot's
retained replies and failure metadata without request headers or credentials.
Claude's retained reply is fenced JSON. GLM returned no reply before two
60-second SDK timeouts. GPT's failed first reply was not retained, so its exact
numeric failure cannot be reconstructed; tests replay its retained successful
ballot and explicitly vary Bcl-2 typography to cover the reproduced parser bug.
The GLM timeout test also replays its recovered live ballot (serialized from
validated reviews with the local `candidate_id` enrichment removed), simulating
its recorded 178.768-second latency without sleeping or calling Cortex.
