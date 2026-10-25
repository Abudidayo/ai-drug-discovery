# Benchmarking drug-repurposing ranking methods: realistic performance, leakage, and evaluation design (2018-2026)

Context for the reader: our setup is 1,956 approved drugs. For each disease we try to recover regulator-approved drugs retrospectively. The network shortlist gets Recall@15 of about 5-7% across 14 diseases. We also run blind 15-candidate panels: 1 true approved drug plus 14 decoys matched on target count, about half of them "plausible" (they act on disease-associated targets). Panels are scored by Hits@5 (chance 33%) and MRR (chance 0.22).

Research notes: I fetched the KG-Bench, TxGNN, Rephetio and Zietz papers in full. Several other sources come from abstracts or search snippets only, and are marked as such. The biorxiv full texts for KG-Bench and the KGE-leakage preprint could not be parsed (PDF binary, then HTTP 429), so KG-Bench numbers come from the PMC version.

## 1. Benchmarks and what they found (KG-Bench, TxGNN, repoDB, Hetionet/Rephetio, method comparisons, hard-to-beat baselines)

### Takeaway
Headline AUROC/AUPRC values of 0.85-0.97 come from balanced 1:1 negatives or from self-reconstruction of known edges. They collapse once you use realistic class ratios, external or temporal test sets, or a degree-only baseline. A degree or "prior" baseline alone reproduces most of the headline AUROC on known edges but falls to about 0.54-0.63 on new indications. Every method should therefore be reported against a degree-only baseline and a permuted-network baseline.

### Cited Findings
**KG-Bench (Wei, Sasi, Piepenbrock, Huynen, 't Hoen + SIMPATHIC Consortium; Bioinformatics 2026;42(5):btag159)**
- It uses a temporal design on Open Targets releases. The graph is trained on 2021.06 (996 drug-disease edges after preprocessing), validated on 2023.06 ("just over 400 newly added drug-disease combinations") and tested on 2024.06. Nodes are fixed across splits; only newly added drug-disease edges are partitioned — [PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- The training graph has 13,004 nodes and 106,793 edges: drug 1,926; target 726; Reactome pathway 983; disease 9,336; therapeutic area 24. Edge counts are drug-target 3,192, disease-target 72,977 and drug-disease 996 — [PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- Negatives are random non-edges. Training and validation use 1:1; test uses 1:1, 1:10 and 1:100 — [PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- AUC/APR results (Table 5, all features + true links): GCN 0.84/0.83; SAGE 0.85/0.85; TransformerConv 0.87/0.86; GAT 0.89/0.86; GIN 0.87/0.85; RGCN 0.91/0.92 — [PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- At a 1:100 negative ratio the best F1 is only 0.28 (TransformerConv), against AUC 0.91 at 1:1. Hits@k and MRR are not reported. There is no random-split comparison — [PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- On bias:
  - Predicted score correlates with a drug's training frequency (Pearson r = 0.352; log-log Spearman rho = 0.569).
  - Positive edges sit on hubs (mean degree 58.2 vs 14.7).
  - Some drugs were predicted for more than 2,000 diseases.
  - The authors call for "bias-aware evaluation metrics" — [PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- The paper also has internal inconsistencies, for example a GCN AUC of 0.82 in the Discussion against 0.83 in Table 5 — [PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)

**TxGNN (Huang et al., Nature Medicine 2024; preprint text at PMC11326339)**
- It uses three splits:
  - **Standard split:** random held-out pairs, so held-out diseases still have some drugs in training.
  - **Zero-shot split:** whole diseases are held out together with all their drugs.
  - **Disease-area splits:** 9 areas (e.g., cardiovascular, neurodegenerative, cancer). All their indications and contraindications are removed, along with similar diseases and some biological neighbours — [PMC11326339](https://pmc.ncbi.nlm.nih.gov/articles/PMC11326339/)
- On the standard split, indication AUPRC is 0.913 for TxGNN against 0.873 for the best baseline (HAN), a +4.3% relative gain. The zero-shot gain is +19.0% for indications (+23.9% for contraindications). Disease-area gains range from 0.5% to 59.3% (mean 25.7%). All figures are relative AUPRC on balanced negatives; absolute zero-shot values are not in the main text — [PMC11326339](https://pmc.ncbi.nlm.nih.gov/articles/PMC11326339/)
- A text model (BioBERT) was the strongest baseline for indications in 7 of 9 disease areas. This suggests literature-derived priors are hard to beat — [PMC11326339](https://pmc.ncbi.nlm.nih.gov/articles/PMC11326339/)
- The authors note that standard evaluations can reward retrieving drugs similar to existing treatments (citing Duran et al.), a shortcut. The disease-area split is meant to counter it — [PMC11326339](https://pmc.ncbi.nlm.nih.gov/articles/PMC11326339/)
- Prospective-style check: of 10 recent FDA approvals tested, 2 ranked in the top 5% of predictions. In EHR data (1.27M patients, 478 diseases), top-1 predictions had a mean log-OR of 2.26, against 2.92 for FDA-approved pairs and 1.09 overall — [PMC11326339](https://pmc.ncbi.nlm.nih.gov/articles/PMC11326339/)

**Rephetio / Hetionet (Himmelstein et al., eLife 2017; just before the window but the reference design)**
- AUROC on the 755 training indications is 97.4% (self-testing). On held-out DrugCentral novel indications it is 85.5%, and on indications in clinical trials it is 70.0% — [eLife 26726](https://elifesciences.org/articles/26726)
- **The prior-probability (degree) baseline alone** scores 97.9% AUROC on known treatments, better than the model, but only 54.1% on DrugCentral and 62.5% on trials. The paper presents this as the danger of encoding treatment degree — [eLife 26726](https://elifesciences.org/articles/26726)
- Of 3,980 predictions above 1% probability, 586 (14.7%) were already-known indications — [eLife 26726](https://elifesciences.org/articles/26726)
- 709 of 1,206 metapaths beat degree-preserving permuted networks at 5% FDR. The best gains were about 22-23% delta AUROC, from paths like CrCtD, i.e. "drugs similar to drugs that treat D" — [eLife 26726](https://elifesciences.org/articles/26726)

**Degree / popularity baselines**
- Zietz et al. (GigaScience 2024) show that a degree-only "edge prior" reaches AUROC ≥ 0.95 in 17 of 20 Hetionet edge types; the best is 0.9971. With 70% of edges subsampled, it still exceeds 0.9 in 14 of 20. Preferential attachment equals the edge prior, i.e. it captures only degree. The authors recommend degree-preserving permutation (XSwap) as the standard baseline. Degree-based performance falls to about 0.5-0.59 when the test network has a different degree distribution — [GigaScience / PMC10848215](https://pmc.ncbi.nlm.nih.gov/articles/PMC10848215/)
- Bonner et al. (Briefings in Bioinformatics 2022) find that KG embedding models on Hetionet rank densely connected entities highly "no matter the context". Adding random, biologically meaningless edges can change a gene's rank. They also flag shortcut edges: up/downregulates edges imply an "associates" edge — [arXiv 2112.06567](https://arxiv.org/pdf/2112.06567)
- Polanco & Newman (PLoS Comp Biol 2025) report AUROC > 0.95 and average precision "almost a thousand times better than chance" on a curated drug-disease network, using cross-validation only (abstract level) — [arXiv 2510.19948](https://arxiv.org/abs/2510.19948)

**Other method-comparison and leakage benchmarks**
- A bioRxiv 2025 preprint on KGE leakage in biomedical link prediction defines three leakage types: train-test redundancy, illegitimate features, and test sets that do not match real inference. Performance drops "substantially" from random and cold-start splits to an independent Orphanet test set. The snippet reports no evidence that node degree alone drives predictions. Authors and numbers are unverified; full text could not be fetched — [bioRxiv 2025.01.23.634511](https://www.biorxiv.org/content/10.1101/2025.01.23.634511.full.pdf)
- de la Fuente et al. (NeurIPS 2023 workshop) find that graph-aware splits show transductive feature generation "over-performed", giving inflated scores. They propose biologically driven negative subsampling — [arXiv 2311.12670](https://arxiv.org/pdf/2311.12670)
- Network proximity (Cheng et al., Nat Commun 2018) covered over 900 FDA-approved drugs. Two of four predictions were validated in patient data. I found no AUC or baseline comparison in the retrieved text — [Network Science Institute summary](https://www.networkscienceinstitute.org/publications/network-based-approach-to-prediction-and-population-based-validation-of-in-silico-drug-repurposing)

### Inferences
- Our Recall@15 of 5-7% over 1,956 drugs is the realistic regime: a full-library, disease-centric ranking with an extreme class ratio. Random chance at 15 of 1,956 is about 0.77%, so 5-7% is roughly 6-9x enrichment. Papers with AUC 0.9 at 1:1 negatives do not contradict this. KG-Bench's own F1 of 0.28 at only 1:100 shows how far balanced metrics overstate precision.
- Baselines most likely to be hard to beat in our setup, based on Rephetio's CrCtD, Zietz, Bonner and KG-Bench's frequency correlation:
  - drug degree or popularity (number of indications, targets, trials, publications);
  - shared-target count between the drug and the disease's genes;
  - "similar to drugs already approved for D" (guilt by association).
  - Each must be run as an explicit arm.
- The Rephetio prior result is the clearest warning. A baseline that wins on known edges can be close to chance on new indications. Any baseline or method should be judged on held-out or new indications, not on recovery of edges already in the graph.

### Gaps
- **repoDB:** I did not retrieve a 2018-2026 benchmark paper reporting numbers on repoDB, so it is not characterised here.
- I found no published head-to-head of network proximity vs KG vs similarity methods under one leakage-controlled, Hits@k/MRR protocol. KG-Bench compares GNNs only; TxGNN compares against GNN/KGE/text baselines with AUPRC.
- TxGNN's absolute zero-shot AUPRC and Recall@k values are only in figures and supplements, which were not read.

## 2. Leakage sources and how to detect and control each

### Takeaway
The main documented inflation sources are:
- answer-encoding edges or features (treats, indication, trial or similar-drug edges);
- degree/popularity shortcuts;
- confounding between drug characteristics and indications;
- poor indication normalisation;
- literature or text features that post-date approval.

Each has a cheap, concrete diagnostic: ablate the feature, permute the network, add a degree-only arm, or apply a temporal cutoff. LLM memorisation in repurposing specifically is under-studied.

### Cited Findings
- **Indication confounding:** Kim et al. (CHIL/PMLR 209, 2023) find "strong confounding between drug indications and drug characteristics data", which causes shortcut learning. Characteristics data could predict ATC class. "Inappropriate normalization of indications" overestimates performance, and existing models were "significantly degraded" under realistic splits for Fdataset and deepDR. Exact numbers are not on the abstract page — [PMLR v209 Kim23a](https://proceedings.mlr.press/v209/kim23a.html)
- **Degree encoding:** In Rephetio, the prior-only AUROC was 97.9% on known treatments but 54.1% and 62.5% on new indications — [eLife 26726](https://elifesciences.org/articles/26726)
- In KG-Bench, scores correlate with drug training frequency (Spearman 0.569) and some drugs were predicted for more than 2,000 diseases — [PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Detection by permutation:** Degree-preserving permutation (XSwap) gives a degree-only baseline. Features that only match it capture degree, not specific connectivity — [Zietz et al., PMC10848215](https://pmc.ncbi.nlm.nih.gov/articles/PMC10848215/)
- **Answer-encoding edges:** Bonner et al. show that KG shortcut relations, such as regulation edges implying association edges, plus topology imbalance drive predictions — [arXiv 2112.06567](https://arxiv.org/pdf/2112.06567)
- In Rephetio, the best-performing metapaths run through existing treats edges (CrCtD, CiPCiCtD) — [eLife 26726](https://elifesciences.org/articles/26726)
- **Open Targets / literature features:** A 2026 preprint analysed 26,278 Open Targets/ChEMBL target-disease pairs. Literature mining alone accounted for most of the classifier's performance, which the authors read as temporal leakage from publications after approval. Genetic support still showed OR = 3.25 (95% CI 2.79-3.79) for approval, holding for post-2015 approvals. This is snippet-level and a preprint — [arXiv 2606.14823](https://arxiv.org/pdf/2606.14823)
- **Context:** Open Targets' "known drug" / ChEMBL clinical-evidence data type is literally the indication/trial record; KG-Bench uses Open Targets drug-disease edges as its labels — [PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Temporal leakage control:** KG-Bench trains on an earlier Open Targets release and tests only on drug-disease edges added in later releases — [PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Transductive leakage:** Features computed on the full graph, including test edges, inflate scores. Graph-aware or inductive splits remove the effect — [arXiv 2311.12670](https://arxiv.org/pdf/2311.12670)
- **Cold-start collapse:** For a compound absent from the training graph, the neighbour set is empty and graph methods fall toward random — [bioRxiv 2026.01.12.699148](https://www.biorxiv.org/content/10.64898/2026.01.12.699148.full.pdf)
- **LLM contamination, general:** Widely reused benchmarks are likely contaminated. Proposed controls include blinding contextual identifiers and transforming values to separate recall from reasoning — [arXiv 2603.25857](https://arxiv.org/html/2603.25857v1)
- A randomised-answer benchmark lets contamination show up as above-ceiling accuracy — [arXiv 2505.18102](https://arxiv.org/pdf/2505.18102v2)
- Contaminated benchmarks mislead conclusions about progress — [arXiv 2502.17521](https://arxiv.org/pdf/2502.17521)

### Inferences
These are our controls, ordered by cost. They come from the findings above; the per-control thresholds are my recommendation.
1. **Feature audit (minutes):** List every feature and edge used by the network shortlist and by the jury prompts. Remove anything derived from:
   - ChEMBL indications or Open Targets "known_drug"/clinical-precedence evidence;
   - ClinicalTrials.gov;
   - drug-label text;
   - "drugs similar to drugs approved for D" when D's approved drugs are the labels.
   - Open Targets *association scores* that aggregate clinical evidence must be recomputed without the ChEMBL/clinical datasource, or replaced by genetic/literature-free datatypes. Otherwise the target-disease score already contains the answer.
2. **Degree/popularity arm (minutes):** Score each panel by drug degree alone: number of targets, number of approved indications, and literature or trial count. Our decoys are matched on target count only. If ranking by *indication count* or *publication count* gives Hits@5 well above 33% on our panels, the panels leak popularity, and decoys must also be matched on that.
3. **Permutation test (an hour):** Re-run the network method on a degree-preserving permutation of the target-disease and drug-target graph. Genuine biological signal is the gap between real and permuted.
4. **LLM memorisation (an hour):**
   - Run the jury with drug names masked (anonymised IDs plus target and mechanism descriptions) vs named.
   - Run a "no reasoning, just recall" probe: ask the LLM to list approved drugs for D, and check how many panel answers it produces unaided.
   - A large named-vs-masked gap, or high unaided recall, means the panel measures memory.
   - Also report the subset of approvals after each juror's training cutoff (see section 5).
5. **Label normalisation:** Collapse salts and derivatives to the parent molecule, as KG-Bench does with ChEMBL parentId, so a decoy is never a salt of the true drug.

### Gaps
- I found no study that quantifies LLM memorisation specifically for drug-indication recovery, such as named vs masked accuracy on approved indications. This is speculative but highly plausible for approved drugs.
- I did not find a quantified estimate of how much Open Targets clinical-evidence datatypes inflate drug-disease recovery. The literature-mining finding is the nearest, and it is a preprint.
- Exact effect sizes from Kim et al. 2023 are in the full PDF, which was not read.

## 3. Statistical design for small evaluations (panel size, number of diseases, paired tests, multiple comparisons, bootstrap CIs, decoy matching)

### Takeaway
With one 15-candidate panel per disease and 14 diseases, a paired comparison has roughly 12-70% power to detect MRR gains of 0.10-0.20, depending on how correlated the two methods are. Detecting a 0.15 MRR gain at 80% power needs about 50-80 independent panels, and about 120 or more for 0.10. Use more panels (several approved drugs per disease, more diseases), paired randomisation or sign-flip tests, a disease-clustered bootstrap, and Holm correction across the 3-5 arms.

### Cited Findings
- In IR, the paired t-test, bootstrap and randomisation tests largely agree. Wilcoxon and sign tests are not recommended — [Smucker, Allan & Carterette, CIIR](https://ciir-publications.cs.umass.edu/getpdf.php?id=744)
- As the number of topics shrinks to 10, disagreement between tests grows. The authors recommend the randomisation test, and the t-test seemed acceptable even with few topics — [CIIR follow-up](https://ciir-publications.cs.umass.edu/pub/web/getpdf.php?id=885)
- A simulation of more than 500M p-values across measures including reciprocal rank, at 25/50/100 topics, finds sign and Wilcoxon tests unreliable for mean effectiveness — [Urbano, Lima & Hanjalic, arXiv 1905.11096](https://arxiv.org/pdf/1905.11096)
- TxGNN reports means over 5 random splits with 95% CIs. Its EHR analysis uses Fisher exact tests with Bonferroni correction — [PMC11326339](https://pmc.ncbi.nlm.nih.gov/articles/PMC11326339/)
- **Decoy difficulty:** Degree-matched vs random negatives change difficulty sharply. Degree-only predictors reach AUROC ≥ 0.95 when negatives are not degree-matched — [Zietz et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC10848215/)
- Biologically driven negative subsampling is proposed to avoid trivial negatives — [arXiv 2311.12670](https://arxiv.org/pdf/2311.12670)
- Random negatives may include undiscovered true associations — [KG-Bench limitations, PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)

**Own simulation (not from literature; my calculation, reproducible)**
- **Model:** the true drug's score is N(d, 1) and the decoys are N(0, 1). There are 15 candidates; d is calibrated to a target MRR. Two methods are compared on the same panels, with correlation rho in their noise. A paired t-test is used, which approximates the randomisation test. 800 replicates.
- **Chance check:** chance MRR = 0.221 and Hits@5 = 0.333, matching our stated chance levels.
- Power at alpha = 0.05 (alpha = 0.01, roughly Bonferroni for 5 arms, in brackets):

| MRR change | rho | n = 14 | n = 30 | n = 50 | n = 80 | n = 120 |
|---|---|---|---|---|---|---|
| 0.30 -> 0.40 | 0 | 0.12 (0.03) | 0.22 | 0.33 | 0.51 | 0.69 (0.47) |
| 0.30 -> 0.40 | 0.5 | 0.14 | 0.31 | 0.48 | 0.68 | 0.88 (0.71) |
| 0.30 -> 0.40 | 0.8 | 0.25 | 0.49 | 0.74 | 0.89 | 0.99 |
| 0.30 -> 0.45 | 0.5 | 0.30 | 0.59 | 0.81 (0.60) | 0.96 (0.85) | 1.0 |
| 0.30 -> 0.50 | 0 | 0.34 | 0.62 | 0.83 (0.62) | 0.97 | 1.0 |
| 0.30 -> 0.50 | 0.5 | 0.44 (0.16) | 0.82 (0.55) | 0.96 (0.86) | 1.0 | 1.0 |

### Inferences
- **14 panels cannot support conclusions** about any single improvement unless the gain is about 0.2 MRR or more and the methods are highly correlated. Even then, power is below 0.7 before multiplicity correction.
- **Ways to increase n within a day:**
  - Build one panel per approved drug-disease pair rather than per disease. Diseases often have several approved drugs, so this could give about 40-100 panels from 14 diseases.
  - Add diseases, aiming for 30 or more.
  - Use 2-3 independently sampled decoy sets per pair.
  - Panels within a disease are correlated. Report a **disease-clustered bootstrap** CI (resample diseases, then panels within disease; 10,000 resamples), and test with a **paired sign-flip randomisation test at disease level** (mean per-disease ΔRR) as the primary test.
- **Panel size:** Keep 15. Larger panels lower chance MRR, so there is more headroom, and per-panel variance falls slightly, but jury cost rises. A non-LLM scorer can also be run on full-library rank (Recall@15 or MRR over 1,956) at no extra cost; that is a more powerful continuous outcome.
- **Multiplicity:** Pre-register one primary metric (MRR) and one primary contrast per improvement against the current baseline. Use Holm-Bonferroni across the 3-5 arms. Hits@5 is secondary. Report effect sizes with 95% CIs, not only p-values.
- **Decoy matching:** Target-count matching alone leaves popularity leakage. The approved drug is likely to have more indications, trials and literature than a random decoy with equal target count.
  - Add matching on indication count or degree, and on publication or trial count. Use strata or a nearest-neighbour caliper.
  - Report results separately for "plausible" decoys (on disease targets) and "implausible" ones.
  - The plausible half should be markedly harder. If Hits@5 on plausible-only panels is near 33%, the method is mostly separating on-target from off-target, which a shared-target baseline already does.
  - Exclude from decoys any drug that is approved, in trials, or off-label for D (or its parent/child terms), so false negatives do not deflate scores.

### Gaps
- I found no literature giving power or sample-size tables specifically for MRR on fixed-size candidate panels. The table above is my simulation under a Gaussian-score model, and real rank distributions may be more skewed (e.g., bimodal: either rank 1 or near-random).
- I found no published study quantifying how decoy matching on popularity or degree changes Hits@k in drug-repurposing panels specifically.

## 4. Disease definition pitfalls (measurement or phenotype IDs, parent vs child terms, indication granularity)

### Takeaway
KG-Bench is the clearest 2026 template:
- drop the EFO "measurement" branch (EFO_0001444) and non-disease ontologies (UBERON, CL, GO and so on);
- require a therapeutic-area annotation;
- keep only the most specific disease level;
- collapse drugs to their parent molecule.

Separately, improper indication normalisation is a documented source of inflated performance.

### Cited Findings
- KG-Bench does the following — [PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/):
  - drops diseases without a therapeutic-area annotation;
  - drops the broad term EFO_0001444 (measurement);
  - filters out anatomical, developmental and cellular IDs (UBERON, ZFA, CL, GO, FBbt, FMA);
  - keeps only the most specific disease level, removing parent IDs;
  - keeps only the drug parentId, removing salts and derivatives.
- "Inappropriate normalization of indications" in drug-disease datasets leads to overestimated performance — [Kim et al. 2023, PMLR](https://proceedings.mlr.press/v209/kim23a.html)
- In the genetic-support analysis of 50 approved drugs, direct associations with ontological expansion explained 19 of 50 genetically supported approvals. Related traits such as biomarkers covered others, which shows that the granularity and expansion choice changes what counts as a match (search snippet; 2022 Nat Rev Drug Discov analysis) — [Nature media asset](https://media.nature.com/original/magazine-assets/d41573-022-00120-3/23246864)
- TxGNN removes similar diseases from training in disease-area splits so that near-duplicate disease terms do not leak — [PMC11326339](https://pmc.ncbi.nlm.nih.gov/articles/PMC11326339/)

### Inferences
- **Label rule for our 14 diseases (recommended):**
  1. Use one canonical disease ID per disease at the clinical-indication level, i.e. the level at which regulators approve.
  2. Define the positive set as drugs approved for that ID **or its descendants**, because approvals are often recorded at child terms (e.g., subtypes).
  3. Pre-register the descendant list.
  4. **Exclude from decoys** anything approved for ancestors, descendants or siblings in that set, and anything in trials for them.
  5. Never use measurement or phenotype IDs (EFO measurement branch, HP terms such as "hypertension" vs a lab measurement) as diseases.
- **Granularity mismatch** between the network's disease gene set (often parent-level, e.g. from Open Targets) and the approval label (often child-level) is a likely cause of both false negatives and inflated hits. Record the chosen level per disease in the pre-registration.
- **Supportive-care drugs:** Drugs approved for supportive or symptomatic indications (e.g., antiemetics in oncology) are "approved for the disease" in some sources but are not disease-modifying. Rephetio restricted itself to disease-modifying indications for this reason (755 treatments). Decide and pre-register whether symptomatic approvals count — [eLife 26726](https://elifesciences.org/articles/26726)

### Gaps
- I did not find a systematic study measuring how parent vs child term choice changes recovery metrics.
- I found no source quantifying how many Open Targets "diseases" in drug-repurposing benchmarks are measurements or phenotypes.

## 5. Temporal-split evaluations (approvals after a cutoff) for prospective-style validation

### Takeaway
Temporal validation is the best available proxy for prospective use, and it gives much lower numbers than retrospective recovery:
- KG-Bench uses Open Targets releases (2021.06 for training, then 2023.06 and 2024.06 for validation and test).
- Rephetio's external sets fall from 97.4% to 85.5% (DrugCentral) and 70.0% (trials).
- TxGNN placed 2 of 10 recent approvals in its top 5%.

For our LLM jury, a post-training-cutoff approval subset is the only direct control for memorisation.

### Cited Findings
- KG-Bench trains on the Open Targets 2021.06 release and evaluates on edges newly added by 2023.06 (validation, about 400 pairs) and 2024.06 (test), with nodes fixed — [PMC13171177](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- Rephetio AUROC falls from 97.4% on training indications to 85.5% on DrugCentral novel indications and 70.0% on clinical-trial indications — [eLife 26726](https://elifesciences.org/articles/26726)
- TxGNN placed 2 of 10 recent FDA approvals in the top 5% of its predictions — [PMC11326339](https://pmc.ncbi.nlm.nih.gov/articles/PMC11326339/)
- Genetic support for approval (OR 3.25) held for post-2015 approvals in a temporal check (preprint, snippet) — [arXiv 2606.14823](https://arxiv.org/pdf/2606.14823)
- Degree-based predictors degrade sharply when the test network's degree distribution differs from training. New approvals often involve less-connected drugs or diseases, so temporal tests penalise popularity-driven methods — [Zietz et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC10848215/)
- I found no published LLM drug-repurposing evaluation restricted to approvals after the model's training cutoff — [search result summary; e.g., bioRxiv 2025.06.13.659527](https://www.biorxiv.org/content/10.1101/2025.06.13.659527.full.pdf)

### Inferences
- **One-day temporal arm (recommended):**
  1. Freeze all inputs (drug-target, disease-gene and graph data) at a snapshot before the cutoff, for example an Open Targets release from about 2022, or simply drop post-cutoff sources.
  2. Use as positives the drugs approved or with new indications after the cutoff (FDA/EMA approval dates from Drugs@FDA or DrugCentral).
  3. Make the cutoff later than every juror's stated training cutoff, so the LLM jury cannot have seen the answer.
  4. The sample will be small, perhaps 10-30 drug-disease pairs across our 14 diseases. Treat it as a descriptive sanity check with a CI, not a powered test.
  5. A method that gains on retrospective panels but not on post-cutoff panels is suspect, either for leakage or for popularity.
- For the network shortlist, the cheaper temporal check is to rebuild features excluding any evidence dated after the approval of each held-out drug. This is mostly feasible if literature and clinical evidence are already removed, as in section 2.

### Gaps
- I did not retrieve the absolute post-cutoff hit rates for TxGNN beyond 2 of 10.
- I found no consolidated, leakage-free benchmark of post-2020 approvals usable off the shelf.
- I did not confirm the training cutoffs for the chosen jury models (GPT-5.4, GLM-5.3, Kimi K3). These must be checked from provider documentation before setting the temporal cutoff.
