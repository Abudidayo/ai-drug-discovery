# RWR and functional STRING comparison

Retrospective source-record relationship recovery. Network scores are not treatment-success probabilities.

Compared **11 Diseases**, excluding all five jury-development cases. Original Stage 1–3, 16-case benchmark and path outputs are unchanged. Configuration and graph/input hashes were frozen at `2026-10-25T01:45:56.924156+00:00` before any RWR evaluation. No tuning was performed.

The exclusions are rheumatoid arthritis, type 2 diabetes mellitus, Parkinson disease, COPD and hypertensive disorder. The remaining cases were already present in the previous 16-case benchmark: this is a jury-development-excluded comparison, not an unseen or prospective clinical holdout.

## Method and graphs

RWR uses the same top-50 evidence_only Disease Target pool before coverage filtering, uniform restart on each graph's retained Disease Targets, restart probability **0.3**, float64 row normalization, L1 successive-iterate tolerance **1e-12** and limit **1,000** iterations. Dangling transition rows use self-loops. Candidate score is mean stationary mass at all retained drug Targets, ranked descending then ChEMBL ID. No distance, z-score or additional normalization is mixed into RWR.

Both graph methods score within their own largest connected component. Thus functional RWR changes both topology and retained Disease/drug Target coverage; the graph comparison does not isolate topology alone. Both graphs are binary, undirected and unweighted after filtering.

| Graph | Nodes | Edges | Components | Largest component nodes | Largest component edges | Build time |
|---|---:|---:|---:|---:|---:|---:|
| functional | 19199 | 273593 | 2144 | 16963 | 273483 | 23.641 s |
| physical | 19199 | 113969 | 6144 | 12834 | 113713 | 0.000 s |

The original graph is the physical subnetwork at combined score ≥700 and direct experiments ≥400. The separate functional-association graph uses the official human `9606.protein.links.v12.5.txt.gz`, combined score ≥700 and no experimental-channel condition. The file was absent initially and downloaded from the [official STRING human downloads](https://string-db.org/cgi/download?species=Homo+sapiens); its actual three columns are protein1, protein2 and combined_score. It was not substituted with physical links. Functional associations may include indirect relationships and are not physical interaction claims. Mapping exclusions, duplicate-edge handling, raw hashes and download provenance are retained. No all-pairs distance matrix was needed for the new graph.

## full_eligible

| Method | Evaluated Diseases | Recall@5 | Recall@10 | Recall@20 | MRR |
|---|---:|---:|---:|---:|---:|
| direct_evidence | 11 | 0.104258 | 0.162411 | 0.216700 | 0.499417 |
| raw_proximity | 11 | 0.058707 | 0.120990 | 0.219736 | 0.513676 |
| degree_matched_z | 11 | 0.044274 | 0.090963 | 0.145216 | 0.275970 |
| rwr_physical | 11 | 0.093620 | 0.146140 | 0.210979 | 0.596212 |
| rwr_functional | 11 | 0.084197 | 0.135046 | 0.229477 | 0.459374 |

## common_scorable

| Method | Evaluated Diseases | Recall@5 | Recall@10 | Recall@20 | MRR |
|---|---:|---:|---:|---:|---:|
| direct_evidence | 11 | 0.128498 | 0.205156 | 0.268546 | 0.499417 |
| raw_proximity | 11 | 0.084470 | 0.161044 | 0.278173 | 0.513676 |
| degree_matched_z | 11 | 0.059221 | 0.125706 | 0.194230 | 0.275970 |
| rwr_physical | 11 | 0.122250 | 0.190737 | 0.269678 | 0.596212 |
| rwr_functional | 11 | 0.107788 | 0.185626 | 0.299722 | 0.459374 |

Full-universe methods use the identical fixed 1,956-Candidate approved universe per Disease; missing scores remain unretrieved misses rather than disappearing from denominators. Common-scorable metrics use the intersection of all five method-available sets. Missing labels and failed methods have explicit null metrics/statuses. Confidence intervals, exact denominators, missing IDs and per-Disease metrics are in the CSV/JSON files.

## Coverage and convergence

| Disease | Physical/functional retained Disease Targets | Physical/functional RWR Candidate coverage | Eligible/common reference pairs |
|---|---:|---:|---:|
| Hypercholesterolemia (HP_0003124) | 37/50 | 1307/1383 | 22/15 |
| Alzheimer disease (MONDO_0004975) | 49/50 | 1307/1383 | 15/14 |
| asthma (MONDO_0004979) | 45/48 | 1307/1383 | 49/44 |
| atopic eczema (MONDO_0004980) | 43/48 | 1307/1383 | 34/34 |
| breast carcinoma (MONDO_0004989) | 45/48 | 1307/1383 | 28/22 |
| Crohn disease (MONDO_0005011) | 45/49 | 1307/1383 | 16/16 |
| epilepsy (MONDO_0005027) | 40/49 | 1307/1383 | 22/20 |
| psoriasis (MONDO_0005083) | 45/49 | 1307/1383 | 33/28 |
| ulcerative colitis (MONDO_0005101) | 43/48 | 1307/1383 | 25/23 |
| prostate carcinoma (MONDO_0005159) | 43/48 | 1307/1383 | 13/7 |
| osteoporosis (MONDO_0005298) | 36/46 | 1307/1383 | 19/11 |

Across the comparison there are **276 eligible Disease–Candidate reference pairs**. Total run time: **16.696 seconds**; RWR solve/scoring timings, iteration counts, residuals and unit-mass checks are in `timings.csv` and the saved per-graph results. Failed methods: `[]`. Candidate unscorable reasons: `{'rwr_functional:no_retained_drug_targets': 6303, 'rwr_physical:no_retained_drug_targets': 7139}`.

## Real leading RWR Candidates

| Disease | Physical RWR leader / mean mass | Functional RWR leader / mean mass |
|---|---|---|
| HP_0003124 | ALIROCUMAB (CHEMBL2109540) / 0.0093261244 | ALIROCUMAB (CHEMBL2109540) / 0.0091329154 |
| MONDO_0004975 | FLORBETABEN (CHEMBL1908906) / 0.01033206 | FLORBETABEN (CHEMBL1908906) / 0.0084830755 |
| MONDO_0004979 | DUPILUMAB (CHEMBL2108675) / 0.010110984 | SILTUXIMAB (CHEMBL1743070) / 0.0084942675 |
| MONDO_0004980 | AFAMELANOTIDE (CHEMBL441738) / 0.0087538727 | LEBRIKIZUMAB (CHEMBL1743035) / 0.0087198763 |
| MONDO_0004989 | CHLORHEXIDINE (CHEMBL790) / 0.012263083 | CHLORHEXIDINE (CHEMBL790) / 0.010241652 |
| MONDO_0005011 | CRAVACITINIB (CHEMBL4596392) / 0.010822645 | CRAVACITINIB (CHEMBL4596392) / 0.0083660911 |
| MONDO_0005027 | BUPIVACAINE (CHEMBL1098) / 0.01075081 | VOCLOSPORIN (CHEMBL5314379) / 0.0063929586 |
| MONDO_0005083 | LEBRIKIZUMAB (CHEMBL1743035) / 0.0075281737 | LEBRIKIZUMAB (CHEMBL1743035) / 0.0069114357 |
| MONDO_0005101 | DURVALUMAB (CHEMBL3301587) / 0.0095950603 | DURVALUMAB (CHEMBL3301587) / 0.006905561 |
| MONDO_0005159 | CHLORHEXIDINE (CHEMBL790) / 0.013209851 | CHLORHEXIDINE (CHEMBL790) / 0.010029043 |
| MONDO_0005298 | DENOSUMAB (CHEMBL1237023) / 0.015434864 | ELACESTRANT (CHEMBL4297509) / 0.0088027947 |

## Paired differences and uncertainty

Differences are second minus first on matched Diseases. The following full-universe comparisons are selected from all ten predeclared unordered pairs; every pair and both scopes are exported.

| First → second | Paired Diseases | Δ Recall@20 [95% bootstrap interval] | Δ MRR [95% bootstrap interval] |
|---|---:|---|---|
| direct_evidence → rwr_physical | 11 | -0.005721 [-0.04436734693877552, 0.029208018490295033] | 0.096795 [-0.12673222610722612, 0.33333333333333337] |
| direct_evidence → rwr_functional | 11 | 0.012778 [-0.031421600491001095, 0.0557208429939045] | -0.040043 [-0.29004329004329005, 0.2196969696969697] |
| rwr_physical → rwr_functional | 11 | 0.018499 [-0.013379035824856257, 0.05855503866735573] | -0.136838 [-0.3338603063603064, 0.06352002164502163] |

Intervals resample Disease-level paired differences using seed 0 and 1,000 bootstrap draws, reusing the existing Stage 3 implementation. With 11 purposively chosen, related Diseases these intervals are descriptive; multiple pair comparisons are not adjusted, and they do not establish clinical superiority or generalization.

## Integration and limitations

New Candidate `rwr.physical` and `rwr.functional` objects contain standalone scores/ranks, per-graph coverage, iteration/convergence information, graph classification/version/manifest hash, and up to three highest stationary-mass Target contributions. Existing network, distance, z-score, shortlist and network_paths fields are preserved exactly. `shortest_paths_explain_this_score=false` explicitly separates RWR from shortest-path explanations. The separately generated COVID-19 integration example preserves every existing path object and is excluded from these metrics.

The reference labels and all known limitations of the original frozen source-reference cohort are retained. Regulatory metadata can contradict cited source text; excluding the five jury-development cases also excludes the previously found trientine/RA contradiction, but does not independently validate the remaining labels. Unlabelled pairs are not proven negatives. Features omit direct clinical-precedence and cancer-biomarker channels, while literature, target curation, functional associations and degree/study biases can retain indirect known-relationship leakage. Plain RWR may favor highly connected proteins; no degree correction or tuning was added.

Artifacts: frozen protocol/cases/references and hashes in the parent directory; enriched rankings, per-graph RWR results, complete stationary distributions, metrics.csv, coverage.csv, aggregate.csv, paired_comparisons.csv, per_disease_comparisons.csv, timings.csv, top_candidates.json, integration_example.json and run.json in this results directory. All generated assets are gitignored. No Model jury, Reactome, frontend, docking or existing scoring module was changed.
