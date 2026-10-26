# RWR extension and frozen graph comparison

[RWR_RESULTS.md](RWR_RESULTS.md) contains the measured 11-Disease results,
per-Disease coverage and leading Candidates, all five methods, paired intervals
and limitations. This extension adds new modules; it does not change the
existing scorer, evaluation metrics or shortest-path reconstruction.

## Reusable API

```python
from ranking.functional_graph import load_rwr_graph
from ranking.rwr import RWREngine, RWRSettings, enrich_ranking

graph = load_rwr_graph("data/ranking/string-12.5-c700-e400")
engine = RWREngine(graph, RWRSettings(restart_probability=0.3))
result = engine.rank(disease, drugs)  # existing load_disease/load_drugs objects
enriched = enrich_ranking(saved_ranking, result, "physical")
```

`row_normalized_transition()` and `stationary_distribution()` are independently
reusable sparse numerical functions. The latter returns `(distribution,
diagnostics)`; distribution is `None` when seeds are missing, convergence fails
or iteration encounters a numerical error. Invalid graph/configuration inputs
raise explicit `ValueError`s. A final unconverged iterate is never scored.

The initial configuration is frozen in [rwr_protocol.json](../../core/ranking/rwr_protocol.json):
restart probability 0.3, L1 consecutive-distribution tolerance 1e-12, at most
1,000 iterations, and top 50 evidence-only Disease Targets selected before graph
coverage filtering. Uniform restart is over the retained Disease Targets.
The graph scope is its largest connected component, separately for each graph.
Disconnected/missing drug Targets are excluded with the existing coverage
reasons; a Candidate with no retained Targets has a null score and rank.

For row-stochastic P and a column distribution p, the update is:

```text
p_next = 0.7 * P.T @ p + 0.3 * p0
score(drug) = mean(p[target] for every retained drug Target)
```

Transition matrices are float64 CSR. Dangling rows receive computational
self-loops so probability mass is conserved; original graph artifacts retain
their original loop-free edges. RWR is calculated deterministically, without
sampling. Higher Candidate scores rank first; exact ties use ChEMBL ID ordering.
No distance, z-score, target-evidence weight or clinical label is mixed into RWR.
Numerical mass is a random-walk distribution, not a treatment-success probability.

## Separate functional graph

Initially only `9606.protein.physical.links.full.v12.5.txt.gz` was present.
The correct human functional file was available on the official STRING site and
was downloaded into ignored `data/string/9606.protein.links.v12.5.txt.gz`.
It has the inspected columns `protein1 protein2 combined_score`, is 62,813,591
bytes, and has SHA256
`3d6894ef3a0a8578b70421b7d6bac159c41ed2f6c1b5da21ab7fabb4ac21cd25`.
Its download URL, UTC, HTTP headers and source classification are in the
adjacent `.source.json` file.

```powershell
.\.venv-ranking\Scripts\python.exe -m ranking.functional_graph --mapping data/stream_a/string_id_map.json --links data/string/9606.protein.links.v12.5.txt.gz --output data/ranking/string-12.5-functional-c700-v1
```

The builder requires the actual functional file and reports a missing input;
it rejects physical-file substitution. It reuses the existing mapping loader's
unmapped/ambiguous/duplicate identifier rules, removes self-loops and deduplicates
unordered gene edges. Its confidence filter is combined score ≥700, with **no
experimental-channel requirement** and no invented experimental score column.

Functional artifacts are separate: `graph.npz`, `index.json`,
`mapping_exclusions.json` and `manifest.json`. The manifest preserves the
functional-association classification. It is an RWR graph bundle, not a new
distance cache; all-pairs shortest paths are unnecessary for RWR. Both graph
loaders verify hashes, stable identifiers, graph structure and LCC membership.

The functional graph has 273,593 edges versus 113,969 physical edges, and an LCC
of 16,963 versus 12,834 genes. Independent verification confirmed it contains
all original physical edges. It was built in 23.641 seconds; the physical graph
was reused. Functional association is broader than a physical interaction claim.

## Frozen comparison and reproduction

```powershell
.\.venv-ranking\Scripts\python.exe -m ranking.rwr_evaluation prepare --root data/evaluation/rwr-functional-ot26.09-v1
.\.venv-ranking\Scripts\python.exe -m ranking.rwr_evaluation run --root data/evaluation/rwr-functional-ot26.09-v1
.\.venv-ranking\Scripts\python.exe -m ranking.rwr_evaluation verify --root data/evaluation/rwr-functional-ot26.09-v1
```

The existing experiment is sealed and already run. Use a new versioned directory
for another run; existing seals/results are never overwritten. Inputs/settings,
the source code, original reports, graph manifests, references and the five
jury-development exclusions were frozen before scoring. Freeze SHA256:
`495886d136830d44a093eb6919266724ed6d9d295b131e456950f18b8cff5bc5`.

The evaluator adapter reuses Stage 3's `case_from_stage2`, `retrieval_metrics`
and `mean_and_interval` without modifying them. It compares direct evidence,
raw proximity, degree-matched z-score and RWR on each graph using identical
eligible universes. It reports full-universe unretrieved-missing-score metrics
and the five-method common-scorable intersection separately. All ten unordered
method pairs have per-Disease differences and paired seed-0, 1,000-resample
bootstrap intervals. Failed methods receive explicit null metrics and reasons.

The run used 11 Diseases and 276 source-reference pairs. All 22 RWR distributions
converged: physical in 59–61 iterations, functional in 54–57. Candidate coverage
increased from **1,307/1,956 (66.82%)** to **1,383/1,956 (70.71%)**, rescuing 76
Candidates with no losses. Reference coverage increased from **234/276 (84.78%)**
to **249/276 (90.22%)**. The common-scorable universe remains 1,307 Candidates.

Physical RWR's full-universe MRR was 0.596212; functional RWR's Recall@20 was
0.229477. These are the largest observed values for those metrics among the five
methods, respectively. Key paired RWR-versus-direct and graph-switch intervals
include zero. This comparison shows a coverage increase without evidence of a
consistent retrieval improvement. Raw mass magnitudes depend on graph/seed scope
and are not calibrated across graphs.

The main run took **16.696 seconds**, including scoring, JSON exports,
evaluation and the separate integration example; graph loading/building and
verification are outside this measured phase. The 22 solves, including restart
preparation, totaled **0.1892 s physical** and **0.3546 s functional**. There were
no failed methods, numerical errors or non-convergence warnings. Unscorable
Candidates all lacked retained drug Targets: 649 per Disease on physical and
573 per Disease on functional.

## Candidate JSON and path compatibility

`enrich_ranking()` adds optional `rwr.physical`, `rwr.functional` and top-level
`rwr_provenance`. It preserves every original field, shortlist, score and path.
The original Candidate `status` and `coverage` continue to describe its original
proximity result; each RWR child has its own status, coverage and rank. This is
particularly important for the 76 Candidates rescued by the functional graph.

Selected fields from the real, separately saved COVID-19 baricitinib integration
example (which is **not included** in the 11-Disease comparison):

```json
{
  "candidate_id": "CHEMBL2105759",
  "rwr": {
    "physical": {
      "score": 0.002009147699179224,
      "rank": 25,
      "status": "scored",
      "graph_version": "string-12.5",
      "graph_kind": "human_physical_gene_undirected_unweighted",
      "converged": true,
      "explanation_kind": "stationary_mass_at_retained_drug_targets",
      "shortest_paths_explain_this_score": false
    },
    "functional": {
      "score": 0.0016137979802853264,
      "rank": 19,
      "status": "scored",
      "graph_version": "string-12.5",
      "graph_kind": "human_functional_association_gene_undirected_unweighted",
      "converged": true,
      "explanation_kind": "stationary_mass_at_retained_drug_targets",
      "shortest_paths_explain_this_score": false
    }
  }
}
```

Actual child objects also include iterations, graph-manifest hash, complete
coverage/exclusion information and up to three highest-contributing drug Targets.
Each contributor has an Ensembl ID, stationary mass and `mass / retained_count`
contribution to the mean. All retained Targets define the score, not just these
display contributors. The original mean distance 1.5, z-score, proximity rank 29
and three `network_paths` representatives are unchanged in this example.
Shortest paths remain explanations of **shortest-path proximity only**. They do
not explain RWR stationary mass or a causal biological mechanism.

## Validation and limitations

All **93 tests pass**: the original 80 plus 13 new tests for row normalization,
analytic stationary solutions, transposition, mass conservation, uniform restart,
reproducibility, disconnected/isolated nodes, failure handling, ranking direction,
top-50-before-filtering, graph switching, functional mapping/filtering, immutable
Candidate/path integration, metric scopes and paired comparisons.

Independent real-data verification checked all **22 distributions** using
`A.T @ (p / degree)`, rather than the transition-construction helper. The maximum
fixed-point L1 residual was **6.546e-13**. All **43,032 Candidate-score records**
were checked against the saved full distributions; all 66 original per-Disease
baseline metric rows (three methods, two scopes, 11 Diseases) were identical to
the original benchmark. Replaying the first frozen Disease on both graphs
reproduced all scores and full distributions exactly. The shared API validator
accepted the real path-preserving integration example. Checks and rescued IDs
are in the new experiment's `verification.json`.

Results and complete stationary distributions are under ignored
`data/evaluation/rwr-functional-ot26.09-v1/results/`; the Markdown report,
CSV/JSON metrics, source hashes, per-Disease comparisons, full Candidate ranks,
Target contributors and iteration/timing diagnostics are retained there.
Original Stage 3 and 16-case reports and artifacts were verified unchanged.

The five jury-development Diseases are excluded, but the remaining 11 were
already used in the prior 16-case benchmark. These are retrospective
source-record recovery results, not an unseen clinical holdout. Source labels
can be incomplete or incorrect; the source-text contradiction found previously
for RA does not disappear as a general data-quality concern merely because RA
is excluded. Functional associations and literature-based features also allow
residual indirect leakage and study/degree bias. Different seed retention across
graphs is part of this comparison. The small, purposive, correlated cohort and
unadjusted multiple comparisons preclude a clinical or broad superiority claim.
