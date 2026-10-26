# Stage 2 results — 24 October 2026

Stage 2 is implemented and executed. It reuses the Stage 1 c700/e400 bundle;
all its saved files were confirmed unchanged by SHA-256 and byte size. No STRING
graph reconstruction or shortest-path precomputation was performed on real data.

## Run configuration and coverage

Both supplied Disease files were ranked against **all 1,956 regulator-backed
approved Candidates** in `data/stream_a/drug_targets.json`. The conditional null
holds the retained Disease Targets fixed, draws 200 size/degree-bin-matched drug
Target sets, and uses seed 0, PCG64 and population standard deviation (`ddof=0`).
The LCC degree pools form 42 bins, each containing at least 100 proteins.
There were 481 distinct drug degree-count profiles per Disease.

| Measurement | Plasma cell myeloma | COVID-19 |
|---|---:|---:|
| Disease ID | MONDO_0009693 | MONDO_0100096 |
| Supplied/selected Disease Targets | 50 | 50 |
| Disease Targets mapped to full graph | 48 | 49 |
| Disease Targets retained in LCC | 44 | 41 |
| Disease Targets excluded | 6 | 9 |
| Candidates with finite z-scores | 1,307 | 1,307 |
| Candidates not network-scorable | 649 | 649 |
| Distance-only / zero-variance / insufficient-pool cases | 0 | 0 |
| Unique shortlisted Candidates | 15 | 15 |
| Ranking calculation time | 4.608 s | 4.541 s |
| Total load, verification and ranking time | 4.833 s | 4.778 s |

The initial examples ran concurrently in separate processes. Timings above are
per-process wall-clock measurements, excluding JSON serialisation and terminal
output. Independent repeat runs took 4.880 s and 4.766 s respectively and returned
identical full Candidate results, shortlists and calculation provenance.

Across the Candidate universe, there are 5,579 distinct-per-drug supplied Target
relationships: 5,496 map to the full graph, 4,769 are retained in the LCC, and
810 are excluded. These are **relationship counts**, not unique genes across
all drugs. The source separately lists 5,715 unresolved items; those include
mechanisms, complexes and non-protein Targets and are not added to a protein
denominator. The 649 non-scorable Candidates remain present with reasons and
can enter a shortlist if their supplied direct evidence supports selection.

## Network rankings: myeloma

Smaller z means closer than expected under the chosen conditional null. `T/M/R/E`
means supplied total, full-graph mapped, LCC retained and excluded drug Targets.

| Rank | Candidate | ChEMBL ID | Mean hops | Null mean | Null SD | z | T/M/R/E |
|---|---|---|---:|---:|---:|---:|---|
| 1 | Sunitinib | CHEMBL535 | 1.731343 | 2.123657 | 0.078474 | -4.999301 | 72/71/67/5 |
| 2 | Nintedanib | CHEMBL502835 | 1.655172 | 2.022672 | 0.074509 | -4.932261 | 65/61/58/7 |
| 3 | Vandetanib | CHEMBL24828 | 1.694444 | 2.126389 | 0.089138 | -4.845789 | 38/37/36/2 |
| 4 | Ponatinib | CHEMBL1171837 | 1.459459 | 1.906622 | 0.099333 | -4.501649 | 41/40/37/4 |
| 5 | Inavolisib | CHEMBL4650215 | 0.800000 | 1.897000 | 0.244113 | -4.493826 | 5/5/5/0 |
| 6 | Dasatinib anhydrous | CHEMBL1421 | 1.760870 | 2.139565 | 0.086585 | -4.373683 | 51/50/46/5 |
| 7 | Midostaurin | CHEMBL608533 | 1.720930 | 2.107326 | 0.089819 | -4.301925 | 48/46/43/5 |
| 8 | Lenvatinib | CHEMBL1289601 | 1.307692 | 1.933846 | 0.146162 | -4.283973 | 13/13/13/0 |
| 9 | Cabozantinib | CHEMBL2105717 | 1.600000 | 2.125667 | 0.130670 | -4.022868 | 15/15/15/0 |
| 10 | Quizartinib | CHEMBL576982 | 1.333333 | 2.005417 | 0.170595 | -3.939646 | 12/12/12/0 |

The direct-evidence baseline contributes the following five additional
shortlisted Candidates. All five have one supplied shared Disease Target.

| Evidence rank | Candidate | ChEMBL ID | Evidence score | Network rank |
|---|---|---|---:|---:|
| 1 | Methotrexate | CHEMBL34259 | 0.667587 | 32 |
| 2 | Chlorhexidine | CHEMBL790 | 0.667587 | 18 |
| 3 | Lonafarnib | CHEMBL298734 | 0.660499 | 115 |
| 4 | Sotorasib | CHEMBL4535757 | 0.660499 | 57 |
| 5 | Adagrasib | CHEMBL4594350 | 0.660499 | 58 |

## Network rankings: COVID-19

| Rank | Candidate | ChEMBL ID | Mean hops | Null mean | Null SD | z | T/M/R/E |
|---|---|---|---:|---:|---:|---:|---|
| 1 | Tofacitinib | CHEMBL221959 | 0.750000 | 2.232500 | 0.302603 | -4.899154 | 5/5/4/1 |
| 2 | Peficitinib | CHEMBL3137308 | 0.750000 | 2.232500 | 0.302603 | -4.899154 | 4/4/4/0 |
| 3 | Filgotinib | CHEMBL3301607 | 0.750000 | 2.232500 | 0.302603 | -4.899154 | 4/4/4/0 |
| 4 | Upadacitinib | CHEMBL3622821 | 0.750000 | 2.232500 | 0.302603 | -4.899154 | 4/4/4/0 |
| 5 | Deuruxolitinib | CHEMBL4594381 | 0.750000 | 2.232500 | 0.302603 | -4.899154 | 4/4/4/0 |
| 6 | Delgocitinib | CHEMBL4297507 | 1.000000 | 2.231000 | 0.256981 | -4.790246 | 5/5/5/0 |
| 7 | Florbetapir | CHEMBL1908919 | 1.000000 | 2.046667 | 0.218683 | -4.786229 | 3/3/3/0 |
| 8 | Ponatinib | CHEMBL1171837 | 1.918919 | 2.335270 | 0.090494 | -4.600871 | 41/40/37/4 |
| 9 | Thalidomide | CHEMBL468 | 1.250000 | 2.183750 | 0.211361 | -4.417799 | 4/4/4/0 |
| 10 | Interferon alfacon-1 | CHEMBL1201557 | 0.500000 | 2.272500 | 0.429527 | -4.126629 | 2/2/2/0 |

The first five have identical retained Target sets and therefore identical
network scores. Their displayed order is a deterministic ChEMBL-ID tie-break,
not evidence that one is biologically superior to the others.

The initial top-five evidence selections are momelotinib, ruxolitinib,
pacritinib, baricitinib and tofacitinib. Tofacitinib is already in the network
selection and records both reasons. Fill the duplicate slot with cravacitinib,
the next supported evidence Candidate not already selected. The final five
additional Candidates are:

| Evidence rank | Candidate | ChEMBL ID | Evidence score | Network rank | T/M/R/E |
|---|---|---|---:|---:|---|
| 1 | Momelotinib | CHEMBL1078178 | 0.603744 | 119 | 7/7/7/0 |
| 2 | Ruxolitinib | CHEMBL1789941 | 0.603744 | 30 | 10/10/9/1 |
| 3 | Pacritinib | CHEMBL2035187 | 0.603744 | 83 | 13/12/11/2 |
| 4 | Baricitinib | CHEMBL2105759 | 0.603744 | 29 | 7/6/6/1 |
| 11 | Cravacitinib | CHEMBL4596392 | 0.603744 | 49 | 2/2/2/0 |

Baricitinib has mean distance 1.5, null mean 2.2325, null SD 0.221044 and
z = -3.313821. It was retrieved and selected through ordinary evidence scoring;
no Candidate was injected for the demonstration.

## Validation, outputs and limits

- All **32 automated tests passed**: the original 12 Stage 1 tests plus 20
  Stage 2 tests covering arithmetic, ranking direction, fixed-Disease matching,
  distinct sampled Targets, bins and insufficient pools, zero variance,
  duplicates, disconnected/missing Targets, score ties, baselines, shortlist
  deduplication/fill, unknown Disease files, release mismatches and CLI integration.
- Changing supplied treatment labels or docking fields does not change Candidate
  results. Candidate reordering, exact duplicates of Target IDs and unrelated
  Candidate additions do not change the relevant scores.
- Both full real rankings were replayed. All Candidate objects, shortlists and
  calculation provenance matched exactly. Every scored Candidate's raw distance
  was separately recomputed by direct matrix indexing, and all z-score arithmetic
  was rechecked (1,307 calculations per Disease).
- Outputs: `data/ranking/stage2/MONDO_0009693.json` (5,229,321 bytes) and
  `data/ranking/stage2/MONDO_0100096.json` (5,229,279 bytes). They contain all
  Candidates, scores, coverage, exclusions, selection reasons and provenance.
  These generated results remain gitignored. No source data or Stage 1 artifacts
  were edited, staged or committed.
- No unexpected real-run failures occurred. Non-scorable statuses are reported
  data-coverage outcomes, not fabricated scores. Missing files/invalid release
  contracts fail explicitly; synthetic tests exercise those cases.
- `fixtures/README.md` remains absent. The loaders follow the inspected release
  schemas. Only two Disease files are currently supplied; any other Disease needs
  a compatible Target file from Stream A.

These runs demonstrate engineering behaviour, not scientific accuracy or clinical
benefit. Some high ranks involve broad measured Target sets; drug action
direction, tissue exposure and treatment efficacy are not modelled here. The
direct-evidence baseline is limited to the 50 supplied Disease scores. No claim
that network proximity outperforms that baseline has been tested.

Stage 2 does not supply complete scientific citations or safety information.
Merge Stream A evidence/safety by Candidate ID before the separately blinded jury
workflow. Snowflake, docking, frontend and the retrospective benchmark remain
outside this implementation.
