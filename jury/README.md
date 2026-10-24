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

`jury.client.run_jury(packet, config, model_call)` accepts a callable with
`(model, prompt, temperature)` arguments returning the raw reply string.
`CortexModel` uses the OpenAI SDK as described in the
[Snowflake Cortex REST documentation](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api).
Retries reuse the same blinded prompt and order, with SDK retries disabled.
Failed calls record exception types only, since exception text can expose secrets.
An invalid reply yields no reviews; its last raw reply and per-attempt errors are
retained. If any reply arrived but none validated, the juror is invalid; failed
means every attempt failed to return a reply. Successful replies have null raw output.

Only the fixture allowlist enters the evidence payload. `rank` appears solely
in output instructions; input ranks and identifiers remain hidden. Candidate IDs
are restored using exact packet labels after validation. Numeric literals are
checked using exact decimal equality against cited evidence `values`; protein
identifiers such as JAK1 and Bcl-2 are excluded from numeric parsing. Structural
checks do not establish biological truth; reasoning still needs manual audit.

Consensus excludes every invalid or failed juror. Equal Borda totals share the
higher rank, with labels in numerical order for deterministic display. No valid
jurors produces an empty ranking. Kendall's W is null with fewer than two valid
jurors or fewer than two Candidates (its denominator is zero). Each juror's
shuffle uses `shuffle_seed + its configuration index`; independent shuffles may
coincidentally match, particularly for small panels. Mock consensus has no
scientific meaning and must remain labelled when displayed.
