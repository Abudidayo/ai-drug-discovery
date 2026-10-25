# HalfLife

**A second life for existing medicines.**

**HalfLife is a network-driven drug-repurposing research platform that combines computational biology, explainable drug ranking, scientific evidence review, and optional 3D molecular docking.**

Thousands of medicines are already approved, yet the relationships between drugs, proteins and diseases are complex. HalfLife explores those relationships to help researchers decide **which existing medicines may be worth investigating for another disease—and why**.

The central prediction engine is **not a language model**. It uses structured biomedical datasets and graph algorithms to rank approved drug Candidates. A separate three-model AI jury critically examines the available evidence, rather than inventing or determining the initial shortlist.


## The idea

Traditional drug discovery can take years. Drug repurposing asks whether medicines with established uses might also be relevant to other diseases. We wanted to approach that question through **transparent computation rather than an opaque AI recommendation**.

HalfLife turns existing knowledge into an investigable workflow:

1. **Choose a Disease** — retrieve evidence-supported human Targets.
2. **Construct its network neighbourhood** — locate those Targets in a protein interaction graph.
3. **Rank approved Candidates** — quantify how strongly each drug's Targets connect to the Disease.
4. **Select 15 Candidates** — combine network ranking with direct evidence.
5. **Explain the results** — inspect verified protein-network paths and relevant evidence.
6. **Challenge the hypotheses** — compare independent AI jury assessments and, where supported, examine predicted molecular binding poses.
7. **Preserve the Experiment** — keep provenance, results and comparisons reproducible.

## How it works

```text
           Open Targets                 ChEMBL + regulatory records
           Disease → Targets           Approved drugs → Targets
                    │                              │
                    └──────────────┬───────────────┘
                                   ▼
                    STRING human protein network
                   (physical and functional graphs)
                                   │
                                   ▼
                      Computational ranking
              ┌──────────────────────────────────┐
              │ Random Walk with Restart (RWR)   │
              │ Shortest-path proximity           │
              │ Degree-matched z-score            │
              │ Direct-evidence / other baselines │
              └──────────────────────────────────┘
                                   │
                                   ▼
                   10 physical-RWR Candidates
                     + 5 direct-evidence Candidates
                                   │
                                   ▼
                     15-Candidate research shortlist
                   ┌───────────────┴──────────────┐
                   ▼                              ▼
           Verified network paths         Scientific evidence packets
                   │                              │
                   └───────────────┬──────────────┘
                                   ▼
                      Three-model evidence jury
                                   │
                                   ▼
                 Candidate comparison and optional
                    Docker-based molecular docking
```

### 1. A real biological network

We integrate human protein interaction data from **STRING 12.5**, mapping protein identifiers onto Ensembl genes and retaining the provenance of the filtered network. The primary graph uses high-confidence physical interactions with:

- STRING combined confidence **≥ 700**;
- direct experimental evidence **≥ 400** (transferred-only experimental support does not satisfy this condition);
- deduplicated, undirected gene-level edges.

The resulting physical graph contains **19,199 mapped genes** and **113,969 unique interactions**. Its largest connected component contains **12,834 genes**. We precompute shortest-path distances for that component and save checksummed, reloadable graph artifacts.

A separate high-confidence **functional STRING graph** supports an additional RWR comparison. It contains **273,593 edges** and a largest connected component of **16,963 genes**. Physical and functional networks are deliberately kept distinct: functional association does not necessarily mean direct physical binding.

### 2. Our computational ranking framework

We designed and implemented a disease-specific ranking pipeline based on established graph methods:

| Method | Question it answers |
|---|---|
| **Random Walk with Restart (RWR)** | How strongly does the Disease's network neighbourhood reach a drug's Targets when probability spreads across the graph? |
| **Shortest-path proximity** | On average, how close are a drug's Targets to the nearest Disease-associated Targets? |
| **Degree-matched z-score** | Is that proximity unusual compared with random Target sets of similar network connectivity? |
| **Direct-evidence baseline** | How strongly do the drug's Targets overlap the Disease's evidence-ranked Targets? |
| **Shared-Target and random baselines** | How does the approach compare with simpler alternatives? |

**RWR is our application default.** Starting from the top evidence-supported Disease Targets, probability flows through the physical graph and restarts at the starting distribution with probability **0.3**. After convergence, the mean stationary probability across a drug's retained Targets determines its network ranking.

The application selects **10 Candidates by physical RWR and five by direct Target evidence**, deduplicating the shortlist to 15 where enough eligible Candidates are available. The original z-score shortlist remains selectable, and raw proximity plus functional RWR remain available as additional comparisons.

We **did not invent** RWR or shortest-path mathematics. Our contribution is constructing, adapting, integrating, validating and benchmarking these methods in a reproducible biomedical ranking framework.

### 3. Explanations, not black-box answers

For shortlisted Candidates, HalfLife reconstructs the nearest verified routes through the physical protein graph—from a drug Target through intermediate genes to a Disease Target. Each path is checked against the saved graph and distance matrix. Representative paths are surfaced in the results; complete paths are retained in a checksummed bundle.

These paths **explain shortest-path proximity**, not the full RWR diffusion score. They are network associations, **not established causal mechanisms**.

### 4. Evidence review and molecular exploration

After algorithmic prioritisation, the **Model jury** uses three distinct AI models through **Snowflake Cortex** to review a common, blinded evidence packet. It examines potential biological mechanisms, Reactome pathways, supporting and contradictory evidence, safety concerns and unanswered questions. The jury is an evidence-review layer, not the source of the initial algorithmic ranking or independent experimental proof.

For supported drug–protein pairs, the platform also includes a **Docker-based molecular preparation and docking workflow**, using **AutoDock Vina** with available experimental structures from the **RCSB Protein Data Bank**. A 3D viewer can show predicted binding poses. Docking suggests possible molecular geometry; it does not establish efficacy.

## Data sources

| Resource | Use |
|---|---|
| [Open Targets](https://platform.opentargets.org/) (26.09) | Disease–Target associations and evidence |
| [ChEMBL](https://www.ebi.ac.uk/chembl/) (37) | Drug IDs, molecules and drug–Target relationships |
| [STRING](https://string-db.org/) (12.5) | Human physical interactions and broader functional associations |
| [Reactome](https://reactome.org/) | Curated pathway context |
| [RCSB PDB](https://www.rcsb.org/) | Experimental macromolecular structures for supported docking |
| Regulatory sources (FDA, EMA, PMDA, DailyMed) | Approval provenance and safety context |

Database identifiers and release versions are tracked wherever available. **Third-party data and licenses remain subject to their original providers' terms.** Large downloaded datasets and generated graph artifacts are intentionally excluded from Git.

## Results and scientific evaluation

We built a versioned evaluation framework with fixed seeds, checksums, frozen inputs, reproducible baselines and paired uncertainty analysis. It evaluates **retrospective recovery of recorded drug–Disease reference relationships**, not treatment outcomes.

### Frozen 14-case shortlist comparison

Both methods selected 15 Candidates per case from the same approved-drug universe.

| Metric | Original z-score shortlist | Physical RWR shortlist |
|---|---:|---:|
| Reference relationships retrieved | **11 / 293** | **15 / 293** |
| Micro Recall@15 | 3.75% | 5.12% |
| Macro Recall@15 | 5.05% | 6.89% |
| Cases with at least one reference retrieved | 8 / 14 | 8 / 14 |

Physical RWR's observed macro Recall@15 advantage was **+1.84 percentage points**, but its **95% paired bootstrap interval was −0.61 to +4.40 points**. It won on four cases, lost on two and tied on eight. **The interval includes zero: consistent superiority was not established.** RWR became the application default as a pragmatic, exploratory product choice—not as a clinically validated improvement.

**Important limitations:** The original frozen 14-case set included `EFO_0803536`, a multiple sclerosis *symptom-measurement trait* mistakenly used for multiple sclerosis. An erratum and sensitivity analysis recorded that dropping this case did not change the conclusion. Some regulatory/approval relationships also require source-text adjudication. Contemporary datasets may contain indirect information leakage; the evaluation is neither prospective validation nor proof of therapeutic efficacy.

### Coverage and reproducibility

- **1,956** approved Candidates processed per Disease in the measured examples.
- **1,307 / 1,956 (66.82%)** were scorable on the physical protein graph; **1,383 / 1,956 (70.71%)** on the broader functional graph.
- The physical-network remainder comprised **557** Candidates with no supplied Targets, **16** without graph-mapped Targets and **76** whose Targets fell outside the largest connected component.
- The ranking workstream had **118 passing automated tests** at the final merge.
- The official replication used the original verified implementation seal and checksum-verified source inputs. It was kept separate from the Model jury's frozen evaluation.

Missing graph coverage is reported explicitly rather than represented as a zero score. A Candidate with no usable network Targets may still be considered through direct evidence when appropriate.

## Example: multiple myeloma

Our demonstration uses **multiple myeloma** (`MONDO_0009693`), a cancer of plasma cells.

1. Retrieve its 50 highest-ranked evidence-only Disease Targets; **44** are retained in the primary physical network.
2. Analyse the approved Candidate universe against those Targets.
3. Select a **15-Candidate shortlist** using physical RWR (10) plus direct evidence (5).
4. Inspect each Candidate's supporting Target information and verified proximity paths.
5. Review the available evidence through the Model jury and investigate a supported docking result, if one is available.

The final application-facing myeloma example includes network-path explanations for **15/15 shortlisted Candidates**. These are research leads, not a treatment recommendation.

## Repository guide

```text
pipeline/          Open Targets, ChEMBL, STRING mapping and evidence preparation
ranking/           Graph construction, proximity, RWR, shortlisting and evaluation
workstream_b/      Application-facing shortlist generation and path enrichment
jury/              Three-model evidence-review client, validation and mock mode
fixtures/          Sample data contracts and mock evidence packets
results/           Published experiments, protocols, validation and errata
docs/              Build reference and architecture notes
.devcontainer/     Shared development and docking-tool environment
plan.md            Project specification
```

The product interface, API, persistence and docking workflow are separate parts of the integrated project; consult their source and deployment configuration for service-specific startup instructions.

## Running the research pipeline locally

**Requirements:** Python **3.11+**, Git, and the relevant Stream A/STRING inputs. The following PowerShell commands run from the repository root on Windows; adapt the virtual-environment path on macOS/Linux.

### Install and test ranking

```powershell
python -m venv .venv-ranking
.\.venv-ranking\Scripts\python.exe -m pip install -e ./ranking
.\.venv-ranking\Scripts\python.exe -m unittest discover -s ranking/tests -v
```

For the Stream A/jury packages and their tests, use the root `pyproject.toml` / `uv.lock` to install their declared dependencies in the environment you use for those components. The jury's mock mode does not require live Cortex credentials.

### Prepare data

Download the licensed source data separately and place the release files in the expected **Git-ignored** directories:

```text
data/stream_a/string_id_map.json
data/stream_a/drug_targets.json
data/stream_a/disease_targets_MONDO_0009693.json
data/string/9606.protein.physical.links.full.v12.5.txt.gz
```

The complete Stream A release is documented under the repository's data contracts, and the original large datasets are not committed. The input schema is described in [`ranking/STAGE2.md`](ranking/STAGE2.md).

### Build and inspect the physical graph

```powershell
.\.venv-ranking\Scripts\python.exe -m ranking build `
  --mapping data/stream_a/string_id_map.json `
  --links data/string/9606.protein.physical.links.full.v12.5.txt.gz `
  --output data/ranking/string-12.5-c700-e400

.\.venv-ranking\Scripts\python.exe -m ranking inspect `
  data/ranking/string-12.5-c700-e400
```

### Rank a Disease

```powershell
.\.venv-ranking\Scripts\python.exe -m ranking rank `
  --artifacts data/ranking/string-12.5-c700-e400 `
  --data-dir data/stream_a `
  --disease-id MONDO_0009693 `
  --output data/ranking/myeloma-ranking.json
```

**Note:** `ranking rank` creates the original proximity/z-score ranking payload. The **application-facing physical-RWR shortlist** additionally requires RWR-enriched rankings and uses [`workstream_b/application_shortlist.py`](workstream_b/application_shortlist.py). See [`ranking/SHORTLIST_HANDOFF.md`](ranking/SHORTLIST_HANDOFF.md) and [`ranking/RWR.md`](ranking/RWR.md) for method selection and complete integration requirements. Do not treat the legacy ranking CLI's default shortlist as the application's RWR default.


## Research integrity

HalfLife intentionally separates **computational prioritisation**, **AI evidence review** and **structural modelling**. None of these alone—or in combination—demonstrates that a Candidate is an effective or safe treatment for a Disease. Our reproducibility checks verify the computations and input integrity, **not the clinical truth** of every third-party record.

## Built at OxHack '26

Developed by a three-person team:

- **Jessica:** source-data pipeline, evidence preparation, pathway context, Model jury and research protocols.
- **Abudi:** application experience, backend, integration, molecular docking and deployment.
-- **Zaid:** biomedical graph construction, prediction algorithms, Candidate shortlisting, network-path explanations and evaluation.
  
**HalfLife — a second life for existing medicines.**
