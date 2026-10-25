# Workflow review: repository evidence

The main Half Life Workflow tab at `/prototypes/?tab=workflow` now uses the same React implementation as `/prototypes/workflow-review/`. `web/src/prototypes/round-three/Workflow.tsx` renders the Story chapters and `TechnicalOverview.tsx` renders the complete technical map and `WorkflowDetails.tsx` renders the source, evidence and docking inspectors. The old standalone controller and global stylesheet have been removed. Story uses the approved still artwork. The technical view preserves the original complete technical diagram and adds an autoplaying evidence walkthrough; it does not execute experiments or call AI providers. Switching back to Story retains its chapter during the session. Technical has one page and removes the irrelevant `stage` parameter; Story uses `stage`, while both views use `tab` and `view` for direct links. Project navigation connects to Problem & solution and Results.

## Selected models

The current team choice in `plan.md:160` is `openai-gpt-5.4`, `glm-5.3`, `kimi-k3`, through Snowflake Cortex, with low reasoning effort for GLM and Kimi. `jury/client.py:131` pins `jury-v7`. These are the selected models shown in this concept, rather than a claim about the active runtime environment.

`pipeline/experiment.py:210-218` loads live IDs from `SNOWFLAKE_MODELS`; `jury/client.py:534-588` implements the Cortex transport, using the OpenAI SDK with the Snowflake base URL. Model names must eventually come from the displayed experiment's recorded configuration.

Older records differ: `api/oxhack_api/fixtures/MONDO_0100096/experiment.json:41-63` is an explicitly fictional fixture with Claude Sonnet 5 / GPT-5.4 / GLM-5.3 and `jury-v3`; `data/a6/live_config.json` is an older recorded Opus / GPT-5.4 / Kimi run. Neither replaces the newer team choice. `results/juror_bakeoff/summary.md` recommends a Grok-containing jury under its frozen reliability rule, while the later explicit choice in `plan.md` uses GPT-5.4 / GLM / Kimi and discusses latency. No benchmark-winner claim is made here.

## Selection and review

- `workstream_b/application_shortlist.py:13-48`: application selection defaults to `physical_rwr`, preserving original ranking artifacts and regenerating proximity explanations.
- `ranking/shortlist.py:32-114`: separate physical-RWR and direct-evidence lanes; deduplicate and refill to the configured 10 + 5 capacity, with coverage and shortfall explicit.
- `jury/client.py:488-520`: Borda consensus across every complete valid ballot; at least two valid jurors are required; Kendall's W and contested decisions are recorded.
- `jury/client.py:629-703`: independently shuffle candidate order, validate ballots, retain bounded retries and model failures.
- `plan.md:174-182`: same source-grounded evidence, with network ranks/scores and selection reasons initially withheld; critiques cover rationale, contradictions, safety and missing evidence.
- `web/src/prototypes/MethodNotes.tsx:1-58`: proximity paths do not explain RWR diffusion; docking is a separate optional investigation.

## Docking evidence

The supplied Devpost draft describes Docker preparation, AutoDock Vina and experimental RCSB PDB structures. Worker code is absent from this workspace checkout. It was verified read-only on the existing `origin/abdullah-nextverse/workstream-c` ref: `worker/oxhack_worker/dock.py:1-114` implements Vina docking and RDKit/Meeko ligand preparation; `worker/README.md` documents experimental structures, queued jobs, and Docker execution. This review does not assert that docking is running locally.

## Design and validation

Approved concept stills were generated with built-in image_gen in the previous design round. The technical specifications were authored with Archify and passed all nine showcase artifact checks with zero composition errors or warnings. The exported SVG illustrations retain the validated routing; their dark palette and larger typography are adapted for this review surface and separately checked in the browser. Original HTML artifacts and delivery receipts live in `.context/workflow-concepts/technical-stage-*.html` and `delivery-*.json`.

Avoid using the Devpost draft's evaluation counts as current measured results without rechecking their versioned source. This surface makes no ranking-superiority or clinical-efficacy claim.

## Expanded association and evidence trail

The review now has five chapters: connect biology, rank medicines, trace evidence, AI jury, and save/inspect. Revised diagrams are `connections-v2`, `selection-v2`, `evidence-v2` and `storage-v2`; the existing jury diagram is retained. Each revised specification passes all nine Archify showcase checks with no composition errors or warnings. HTML artifacts and receipts are under `.context/workflow-concepts/technical-<name>.html` and `delivery-<name>.json`.

- `pipeline/packets.py:400-415` joins drug and disease targets by Ensembl gene ID, builds an association statement from the evidence-only score, and embeds the ChEMBL mechanism description in its stored statement.
- `pipeline/packets.py:365-374` stores each item's experiment-local E-ID, kind, source, source ID, URL, pinned release, statement and numeric values. Association, bioactivity and pathway statements are constructed from structured fields; these must not be described as universal verbatim publication extracts.
- `ranking/rwr.py:17-21,52-95,114-150` defines default restart probability 0.3, seeds retained members of the top 50 evidence-only disease targets, iterates `p = (1-alpha) P.T p + alpha p0`, and scores drugs by the mean stationary mass at their retained targets. This is network relevance, not a Pearson correlation or a probability of benefit.
- `pipeline/pathways.py:115-122` joins stable Ensembl IDs through shared Reactome memberships; `pipeline/packets.py:505-553` adds at most three smallest eligible shared pathways per candidate. Shared membership does not establish direction or effect.
- `jury/client.py:197-215` exposes only the allowlisted candidate fields and evidence ID/kind/statement/values to models; source URLs and ranking metadata are retained in the experiment rather than treated as a model browsing instruction.
- `jury/client.py:385-485` verifies schema, rank uniqueness, assigned evidence IDs, safety fields and quoted numeric values. These checks do not establish semantic or scientific truth.
- `pipeline/a6.py:235-271` preserves full rationale wording beside the exact cited statements for manual auditing.

## TigerData persistence

Verified read-only on `origin/abdullah-nextverse/workstream-c` because the backend and database implementation are absent from this workspace checkout:

- `db/README.md:1-5` identifies Tiger Cloud as the production PostgreSQL service.
- `db/migrations/0001_initial.sql:11-53` defines experiments and candidate evidence JSONB; subsequent tables retain jurors, jury votes, docking jobs and file references.
- `api/oxhack_api/repo/postgres.py:395-420` writes complete candidate objects, including evidence statements, into JSONB. Lines 508-535 write exact rationale, objection, missing evidence and citation arrays into jury votes.
- `api/oxhack_api/services/live_jury.py:110-142` reconstructs the blinded packet from persisted candidate evidence, excluding plain-language summaries. The initial schema's `jury_packet` column alone is not evidence that this runtime populates that column.
- Large graphs and pose files remain in file storage; PostgreSQL retains references and checksums. No vector-search or embedding claim is made for TigerData.

## Exact archived example

`recorded-evidence.json` copies the valid `kimi-k3` / `jury-v5` review for MOMELOTINIB from `data/a6_paths/MONDO_0100096/jury_result.json`, along with all 18 cited items from that directory's `evidence_packet.json`. The inspector preserves the rationale, objection and every statement byte for byte as JSON strings. It is explicitly labeled an archived example, separate from the currently selected `jury-v7` configuration. E2 links to the recorded ChEMBL mechanism 5280; other citations select their own exact saved statements and source records.

## Transparent header correction

The live header and both navigation groups have transparent backgrounds and no outer border. The original concept images contained baked-in branding and top navigation, which would otherwise show through the transparent header. Built-in image_gen removed only that top-edge UI into sibling assets `assets/story-1-header-clean.png`, `story-2-header-clean.png` and `story-3-header-clean.png`. The original concepts are retained. Exact edit instructions and source/output mapping are in `assets/header-cleanup-prompts.json`. The canvas dimensions and illustration framing are retained.

The footer also has a transparent background. Its former gradient band is removed. A second localized built-in image_gen edit removes the bottom chapter controls and footer shading baked into the artwork, continuing the illustrated scene to the bottom edge. Current assets are `assets/story-1-navigation-clean.png`, `story-2-navigation-clean.png` and `story-3-navigation-clean.png`; prior originals remain available. `assets/footer-cleanup-prompts.json` records the exact prompt and source/output mapping. Native chapter controls remain interactive on top of the artwork.

## Single-page technical overview

The user requested one technical page containing the entire workflow. `TechnicalOverview.tsx` renders the original connected diagram (`diagrams/complete-workflow-v2.svg`), with animated markers following the checked routes extracted into `workflow-routes.json` with all biomedical sources, stable gene-ID joins, shared targets/pathways, physical-RWR plus direct-evidence selection, traceable statements, all three Cortex model IDs, ballot validation and comparison, TigerData persistence and optional molecular preparation/docking. Supporting text includes the RWR equation, the two-valid-juror threshold, interpretation limits and file-storage distinction. There is no technical chapter navigation. Evidence and docking inspectors remain available without leaving the page.

The Archify specification `complete-workflow-v2.json` passes all nine showcase artifact checks with zero composition errors or warnings. The delivered HTML, receipt and validation are `.context/technical-overview/overview.html`, `delivery.json` and `validation.json`. The adapted SVG uses the same checked geometry with larger text and the website palette, checked separately in the live page. All content fits the tested 1280×800, 1440×900, 1600×1000, 1920×1080 and 2048×1320 viewports.

## Anchored overview with visible technical methods

The main flow keeps five steps and shows the actual methods: shared Ensembl targets, shortest STRING paths, Reactome, Open Targets and ChEMBL; Random Walk with Restart and the 10 network + 5 direct-evidence shortlist; saved statements, exact values and E-ID citations; GPT-5.4, GLM-5.3 and Kimi K3 via Snowflake Cortex; and computational ranks beside Borda AI consensus. TigerData persistence and optional AutoDock Vina exploration remain connected below. The original complete engineering diagram and longer notes remain unchanged behind the “Technical details” button on the same page.

The user rejected detached numbers, the changing sentence and the overall disconnected layout. Labels now use HTML headings and paragraphs inside fixed diagram boxes. SVG draws only the connectors; the separate marker plane follows the same coordinates. Step numbers and the live caption are removed. The heading and subtitle share one alignment, and controls and inspector links sit directly under the diagram. Core algorithms and evidence stay visible rather than being hidden as a consequence of simplification.

`workflow-simple-map.json` defines the node contents and routes. `TechnicalOverview.tsx` samples paths once and animates transform/opacity markers through seven phases. Only markers and the active box change; text content and position stay fixed. Pause preserves the frame; Play resumes; Replay restarts. Hidden tabs pause and reduced-motion settings produce a static complete overview. This is an explanation, not live experiment status. Chrome stays transparent and the lab backdrop stays removed.

`prototypes/technical-motion-check.mjs` checks that all text fits its box and remains unchanged throughout the loop, core methods are visible without expansion, full details work by keyboard, playback behaves correctly, laptop viewports fit, evidence inspectors work and the review route shares the component.

## Key points inside each step

Every node now separates one highlighted takeaway from its supporting methods. Mint semibold text gives each step a scannable point; the active step uses amber during playback without changing its text or position. Selection counts, exact source wording, independent review, Borda consensus, persistence and predicted poses remain explicit. Taller boxes preserve the existing routes and keep the supporting terms visible. The browser checks cover all seven takeaways as part of text containment and stable playback geometry.

## Visual operations inside the workflow

`WorkflowVisual.tsx` replaces empty card interiors with seven meaningful SVG illustrations: a protein path, ten network and five direct-selection slots, an archived source-to-E2 citation, three parallel model reviews, a comparison of rank lists, PostgreSQL persistence and a predicted ligand pose. The network and rank diagrams are schematic, not experimental results. The selection slots represent configured capacities; deduplication, refill and missing coverage still control the actual shortlist. Network paths explain associations/proximity rather than RWR diffusion.

The source example uses the unchanged phrase “JAK1 inhibitor.” from archived ChEMBL E2 in `recorded-evidence.json`. Its full statement and exact archived model wording remain in the inspector. The jury illustration shows the selected GPT-5.4, GLM-5.3 and Kimi K3 configuration, separate from that older archived example. No live job or model call is implied.

The walkthrough now spends time on each operation before sending evidence along the next connector. Active graphic cues animate opacity; connector markers animate transforms/opacity. All text remains fixed. Internal cues share pause, replay and reduced-motion behavior with the main walkthrough. Diagram sizing follows both laptop width and available height so the entire overview remains visible. The browser regression checks include actual movement, freezing the internal cues on pause, stable SVG labels, and zero running animations under reduced motion.
