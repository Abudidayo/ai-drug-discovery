# OxHack team proposal

Status: MVP scope consolidated for team discussion. Experiment forks are excluded. Architecture and ownership will be decided with the team; hardware performance and service access still need verification.

## The idea

Build an interactive drug-repurposing explorer for students. Enter a disease, discover associated proteins and existing approved drugs that act on them, then compare the evidence and AI explanations. Select a promising candidate and a supported protein to generate predicted binding poses and inspect them in 3D.

The distinctive feature is the move from reading recommendations to exploring a molecular prediction on demand. The app produces research hypotheses and teaches how the evidence fits together; it does not establish that a drug treats a disease.

## Committed experience

1. Search any disease. Explain clearly when evidence is missing or docking is unavailable.
2. Show five highlighted candidates with molecule drawings, evidence, mechanisms and safety warnings, plus an expandable candidate list.
3. Have several Snowflake Cortex models rank the same candidates from the same evidence. Show reasons, agreement and disagreement. Agreement is not a treatment-success probability.
4. Compare candidate drugs side by side within that experiment.
5. Select one candidate and one prepared protein to generate docking poses. Show progress, failures and a simple 3D viewer with rotate, zoom, surface and pose selection.
6. Automatically save the experiment and docking results. Support history, archive and restore.

Broad disease search is committed. Docking for every disease is not: it requires a suitable prepared protein structure, so the first version offers a small tested set and explains availability before submission.

## Data and sponsor roles

| Component | Role |
| --- | --- |
| Open Targets | Disease search, disease-target associations and known drug-target relationships |
| ChEMBL | Supporting drug and bioactivity evidence |
| PubChem | Molecular structures and properties |
| RCSB PDB | Experimentally measured protein structures for supported docking targets |
| Snowflake Cortex | AI model jury using the retrieved evidence |
| Tiger Cloud PostgreSQL | Shared storage for saved experiments, evidence, statuses and result-file references |
| DGX Spark or existing cloud GPU | Preferred docking execution, subject to access and compatibility checks |

The database stores our app's history and computed results. It does not need to contain a copy of every disease or drug. Use experiment identifiers in shared tables, with molecular files in file or object storage. No database forks or experiment branching.

Snowflake and Tiger Cloud accounts reportedly exist; authenticated access has not been verified. Hosting remains to be selected when architecture is discussed; Vultr availability is unconfirmed.

## Required build tasks

These are implementation tasks for the Build backlog, separate from Wayfinder decision tickets. Completion checks describe usable behavior rather than a prescribed stack.

| Task | Complete when | Depends on |
| --- | --- | --- |
| Disease and candidate evidence pipeline | A disease resolves to stable identifiers, sourced target links and approved candidate drugs; missing targets/drugs produce explicit empty states. A known-answer check runs without inserting its expected candidate. | API access |
| Cortex model jury | Several models receive the same evidence and return structured rankings and reasons. The app handles model failures, preserves warnings and evidence links, and separates model agreement from treatment claims. | Candidate evidence; Cortex access |
| Guided results and candidate comparison | A user can search, understand each stage, browse candidates and compare evidence, warnings and available docking results within one experiment. | Pipeline and jury response formats |
| Docking execution and hardware validation | One supported drug-protein pair produces valid, loadable pose files on an accessible machine. Record startup/warm latency, dependencies and method provenance; show queued/running/completed/failed states. | Machine access; prepared structures and ligands |
| Simple 3D docking viewer | The chosen protein and generated poses load together; users rotate, zoom, toggle surface and switch poses. The view identifies the pair and explains any displayed score. | Valid docking output; can develop against a labeled sample first |
| History and result storage | Reloading preserves experiments, candidate results and docking outcomes. Saved experiments can be archived/restored. A failed docking request retains the rest of the experiment. No forks. | Tiger access; agreed result formats |
| End-to-end integration and deployment | The full disease-to-candidates-to-docking-to-history journey works in the deployed app. Verify empty results, upstream/model errors, unsupported docking and failed docking without losing saved work. | All above; hosting access |

For the simplest first version, disable archiving while docking is active. Treat background completion in archived experiments as optional. Authentication and the exact deployment design belong in the team architecture discussion; do not expose one person's history to unrelated users.

## Build order and delivery checks

Start by checking sponsor access and running one real docking pair on available hardware. In parallel, agree the data contracts and build the evidence pipeline; UI and viewer work can use clearly labeled fixtures until real results are ready. Connect the jury and persistence, then verify the complete journey.

Prefer DiffDock for AI pose generation. Keep AutoDock Vina as a conventional docking alternative if needed, clearly labeled as such. DGX Spark is preferred and the Mac is an intended CPU fallback, but neither route has been benchmarked on our machines. Do not promise a response time or guaranteed Mac compatibility. Under two minutes for a warm request is a target to test, not a measured capability.

Use COVID-19/baricitinib as a labeled known-answer retrieval check and multiple myeloma as the second exploration example. Do not force a ranking to make either example work. Test docking against an appropriate structural control for its actual protein; retrieving a known drug is a separate check from validating pose generation.

If live docking is not ready, a clearly labeled saved result can demonstrate the viewer during development. It does not satisfy the committed live docking task. Keep access, warm latency, output validity and a structural control visible as acceptance checks before claiming it works.

## Excluded and deferred

- No experiment/database forks, branching, cross-experiment comparison or jury-settings editor.
- No training our own models, molecule editing or clinical recommendations.
- New molecule generation, vector similarity search and a model-accuracy leaderboard are optional extensions after the core journey works. No leaderboard accuracy claims without a defined evaluation.
- Architecture and team allocation follow review of the build tasks above.
- Formal [Demo script and pitch](https://linear.app/abudi-acc/issue/ABU-14/demo-script-and-pitch) remains a separate human-led task outside the discovery hierarchy. This proposal is for aligning the builders.

## Team handoff

Ask the team to agree the scope, allocate the build tasks, choose the integration/deployment design and confirm who can provide machine and sponsor access. A dedicated docking owner is sensible because preparation, runtime setup and output validation are closely connected; that person can hand a stable result contract to the viewer implementer. Assign people after reviewing the full task list.

Related records: [Planning](https://linear.app/abudi-acc/issue/ABU-6/planning), [MVP specification](mvp-spec.md), [domain glossary](../CONTEXT.md). The tracker remains the decision index; this document is the implementation handoff.
