# Knowledge-graph, ML and transcriptomic methods for ranking approved drugs per disease (2018–2026): what to add beside network proximity

Scope: methods that are not network proximity, which we could add to a hackathon pipeline. The setting is 1,956 approved drugs, local Open Targets 26.09, ChEMBL 37 and STRING 12.5, a CPU laptop and about one day. All numbers below come from the cited source and benchmark. Preprint status and conflicts are flagged where they apply.

## 1. TxGNN (Huang et al., Nat Med 2024) and PrimeKG (Chandak et al., Sci Data 2023): performance, "disease-centric split", downloadable predictions, licences, criticisms

### Takeaway
TxGNN's headline gains are relative AUPRC gains, measured against sampled negatives on PrimeKG's own DrugBank-derived labels. An independent re-run (OREVID, a preprint) found TxGNN only modestly above a drug-popularity baseline on zero-shot diseases: Recall@100 of 0.412 against 0.358. On approvals that sit outside PrimeKG, TxGNN does no better than popularity. TxGNN publishes no downloadable full drug×disease score matrix. Its full-graph predictions would also leak, because PrimeKG contains the indication edges we would test against. For our pipeline, TxGNN is a citation and comparator, not a component.

### Cited Findings
**TxGNN reported performance**
- TxGNN ranks drugs as indications and contraindications for 17,080 diseases and 7,957 drugs, and 92% of those diseases have no indications. Against 8 methods, it "improves prediction accuracy for indications by 49.2% and contraindications by 35.1% under stringent zero-shot evaluation." — [Huang et al., Nat Med 2024 (PMC full text)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11645266/)
- Standard random split, where drug–disease pairs are shuffled and the held-out diseases still have some indications in training: three of eight baselines exceed AUPRC 0.80. HAN is best at 0.873, and TxGNN reaches 0.913, a 4.3% gain. — [PMC11645266](https://pmc.ncbi.nlm.nih.gov/articles/PMC11645266/)
- Zero-shot split: "We began by holding out a random set of diseases and then moved all their associated drugs to the holdout set." Here TxGNN gains 19.0% AUPRC for indications and 23.9% for contraindications over the next-best method. The paper also notes "a notable degradation in performance for baseline methods" in this setting. — [PMC11645266](https://pmc.ncbi.nlm.nih.gov/articles/PMC11645266/)
- The "disease area" split is the stringent disease-centric one. Nine areas are used: diabetes, adrenal gland, autoimmune, anemia, neurodegenerative, mental health, cardiovascular, metabolic disorder and cell proliferation. Held-out diseases "(1) have no approved drugs in training, (2) have limited overlap with the training disease set because we excluded similar diseases and (3) lack molecular data because we deliberately removed their biological neighbors from the training set." TxGNN's relative AUPRC gains across areas are 0.5–59.3% (average 25.72%) for indications and 11.8–35.6% (average 18.67%) for contraindications. The best baselines were BioBERT for indications (7/9 areas) and RGCN for contraindications (8/9). — [PMC11645266](https://pmc.ncbi.nlm.nih.gov/articles/PMC11645266/)
- AUPRC is computed against generated negatives: "To generate the dataset for negative samples, D−, we used a sampling technique… creating counterparts for each positive pair" (details in Supplementary Note 4). The metric therefore scores separation of positives from sampled negatives, not full-list ranking over all drugs. Five random data splits are used (n=5). — [PMC11645266](https://pmc.ncbi.nlm.nih.gov/articles/PMC11645266/)
- Clinical proxy: Mount Sinai EHRs, 1,272,085 adults. The top TxGNN candidate had a mean log(OR) of 2.26 for co-prescription with the disease. The average over all pairs is 1.09, and FDA-approved indications average 2.92. — [PMC11645266](https://pmc.ncbi.nlm.nih.gov/articles/PMC11645266/)
- The human study was small: 12 experts across 192 trials. The authors' own caveat is that "its capabilities depend on the quality of medical KGs." — [PMC11645266](https://pmc.ncbi.nlm.nih.gov/articles/PMC11645266/)
- The authors state that "GNN models exhibit substantially reduced predictive performance on splits designed to reflect the sparse nature of knowledge on these diseases, as opposed to random splits." — [PMC11645266](https://pmc.ncbi.nlm.nih.gov/articles/PMC11645266/)

**Availability, compute and licences**
- Code is MIT licensed at github.com/mims-harvard/TxGNN. Splits: `complex_disease`, 9 disease-area splits, `random`, `disease_eval` (masks one disease by index) and `full_graph` (95/5 train/validation, no test). The install needs Python 3.8, DGL 0.5.2 built against CUDA, and PyTorch Geometric for the disease-area split. The examples use `cuda:0`. One example pretrained checkpoint is on Google Drive. The README does not mention precomputed predictions and points to the txgnn.org explorer. — [TxGNN GitHub](https://github.com/mims-harvard/TxGNN)
- The paper's data statement says "The KG and all auxiliary data files are available via Harvard Dataverse at 10.7910/DVN/IXA7BM." The article is CC BY-NC-ND 4.0. — [PMC11645266](https://pmc.ncbi.nlm.nih.gov/articles/PMC11645266/)
- The Dataverse record was queried live through its API. It is licensed CC0 1.0 and contains only KG files: `kg.csv` (982 MB), `kg_giant.csv`, `kg_grouped.csv`, `kg_raw.csv`, `edges.csv`, `nodes.tab`, `drug_features.tab`, `disease_features.tab`, `kg_grouped_diseases*.tab` and `README.txt`. **No drug–disease prediction file is present.** — [Harvard Dataverse API, doi:10.7910/DVN/IXA7BM](https://dataverse.harvard.edu/api/datasets/:persistentId/?persistentId=doi:10.7910/DVN/IXA7BM)
- The OREVID repo ships TxGNN's benchmark-split scores (`benchmark/predictions/txgnn/results.json`). It reports that retraining TxGNN across all splits took about 22 h as a GPU job on Linux/WSL with CUDA. — [OREVID GitHub](https://github.com/orevid-org/orevid)

**PrimeKG content and licence**
- PrimeKG has 129,375 nodes and 4,050,249 edges from 20 resources, covering 17,080 grouped diseases (22,205 MONDO concepts collapsed). Drugs are coded by DrugBank ID. Drug–disease edges come from DrugBank 5.1.8 (retrieved 31 May 2021) and DrugCentral: "26,698 indication edges, 8,642 contraindication edges, and 1,917 off-label use edges." There are 2,672,628 drug–drug edges. — [Chandak et al., Sci Data 2023 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9893183/)
- The PrimeKG Dataverse distribution is CC0. However, it contains DrugBank (CC BY-NC 4.0) plus SIDER and DisGeNET (CC BY-NC-SA 4.0). — [OREVID GitHub licence table](https://github.com/orevid-org/orevid); [Dataverse API](https://dataverse.harvard.edu/api/datasets/:persistentId/?persistentId=doi:10.7910/DVN/IXA7BM)

**Independent re-evaluation and criticism (preprints, not peer reviewed)**
- **OREVID** is a preprint by independent researcher Joaquim Quadrada Jané, posted on Preprints.org about 20–22 Oct 2026. It retrained TxGNN with the official code on the same PrimeKG splits and reproduced zero-shot Recall@100 of 0.412 against a published 0.405. Its Recall@100 results, mean over diseases:

  | Test | Popularity | TxGNN | RotatE | OREVID |
  |---|---|---|---|---|
  | Zero-shot diseases (5 seeds) | 0.358 | 0.412 | 0.289 | 0.811 |
  | Hard (near-identical diseases removed) | 0.203 | 0.258 | 0.162 | 0.539 |
  | Whole disease areas hidden (9) | 0.185 | 0.237 | 0.219 | 0.617 |
  | External: Open Targets approvals not in PrimeKG | 0.130 | 0.121 | 0.156 | 0.359 |
  | Temporal (2015 graph) | 0.181 | 0.117 | n/a | 0.283 |

  Sources: [OREVID GitHub README](https://github.com/orevid-org/orevid); [OREVID preprint](https://www.preprints.org/frontend/manuscript/6395e853ccac5f68dbff15fb3dcef39f/download_pub); [Open Targets Community post](https://community.opentargets.org/t/orevid-an-open-drug-repurposing-tool-and-benchmark-built-on-open-targets-26-06/2098)
- Conflict: one search snippet of the preprint gives the external recent-approvals test (158 approvals) as 0.355 for OREVID, 0.119 for TxGNN and 0.097 for popularity. The README gives 0.359, 0.121 and 0.130. The FAIR_COMPARISON document gives 0.809 against 0.421 under a stricter protocol. Treat these numbers as approximate. — [OREVID preprint v2](https://www.preprints.org/frontend/manuscript/79012cca9080b083decac69708d22b29/download_pub); [OREVID GitHub](https://github.com/orevid-org/orevid)
- **CellAwareGNN** (bioRxiv 2026) argues that earlier evaluations tested only random subsets of diseases. It builds an updated PrimeKG-U and a stronger TxGNN-U baseline. — [CellAwareGNN bioRxiv](https://www.biorxiv.org/content/10.64898/2026.02.20.707076v2.full)
- **BioPathNet** (Nat Biomed Eng 2025) missed some FDA-approved Alzheimer's drugs because those drugs were absent from PrimeKG or lacked indication edges. This shows coverage gaps in the label set. — [BioPathNet, Nat Biomed Eng](https://www.nature.com/articles/s41551-025-01598-z)

### Inferences
- "Disease-centric split" means that every indication and contraindication edge of a held-out disease is removed from training. In the strict "disease area" form, related diseases and the disease's biological neighbours are removed too. That matches our leakage rule of using other diseases' approvals but never the target disease's own.
- TxGNN's AUPRC is measured against sampled negatives, and the reproduced popularity baseline is close behind it. Its large relative gains therefore do not translate into a large advantage when ranking 1,956 approved drugs. In the external test, a degree-only ranker is roughly as good.
- We cannot download a leakage-safe TxGNN score per (drug, disease). `full_graph` training includes the test diseases' DrugBank indication edges. Running `disease_eval` per disease needs a CUDA GPU and DGL 0.5.2, which is infeasible on a CPU laptop in a day. PrimeKG also uses DrugBank IDs, so we would need a DrugBank→ChEMBL mapping (for example, UniChem).
- Licence risk: PrimeKG's indication and drug features derive from non-commercial DrugBank. Using them is fine for a research hackathon, but they are not "open" in the CC0 sense.

### Gaps
- Absolute zero-shot AUPRC values for TxGNN and baselines appear only in figures and Supplementary Tables 1–2, which I did not extract. Only the relative gains are confirmed here.
- I could not confirm whether txgnn.org offers a bulk export. The OREVID preprint PDF returned HTTP 403, so its full methods were not read directly; the numbers come from the README, search snippets and the community post.
- I found no peer-reviewed critique of TxGNN.

## 2. Knowledge-graph embedding and GNN link prediction (Hetionet/Rephetio, DRKG, TransE/RotatE/ComplEx): typical metrics and the random vs disease-held-out gap

### Takeaway
Random-split numbers are high, with AUROC around 0.83–0.94 and MRR from about 0.2 to 0.5. They collapse under disease cold-start splits and on independent labels: MRR falls to about 0.09, and to about 0.01–0.03 on Orphanet. Much of the random-split signal is node degree. Rephetio already showed this in 2017: a degree-only prior scored AUROC 0.979 in training but 0.541 on external indications. Off-the-shelf KGE is not worth a day here.

### Cited Findings
- **Rephetio (Himmelstein et al., eLife 2017).** It used Hetionet v1.0 (47,031 nodes of 11 types, 2,250,197 edges of 24 types, from 29 resources). Logistic regression on metapath features gave AUROC 97.4% on the 755 PharmacotherapyDB training treatments. External results were 85.5% on DrugCentral novel indications and 70.0% on clinical-trial indications. **A treatment-degree-only prior reached 97.9% in training but 54.1% on DrugCentral and 62.5% on trials.** Among the top 100 epilepsy predictions, 15 were ictogenic, because "binds" edges carry no direction. Hetionet's licensing was mixed: 4 non-commercial sources and 9 unlicensed. (2017 predates the requested window; included as the reference point.) — [Himmelstein et al., eLife 2017](https://elifesciences.org/articles/26726)
- **Degree baseline.** Across 20 biomedical networks, a permutation-derived "edge prior" based only on node degree gave AUROCs "frequently exceeding 0.85." The authors recommend it as a mandatory baseline, and the xswap Python package implements it. — [Zietz et al., GigaScience 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10848215/)
- **Leakage benchmark (Brière, Stosskopf, Loire, Baudot; bioRxiv 2025, v3).** Indication-relation MRR on ShepherdKG (derived from PrimeKG plus Orphanet), for RESCAL: random 0.27, drug cold-start 0.16, disease cold-start 0.09. For ANALOGY: 0.21, 0.09, 0.07. A degree-preserving permutation drops RESCAL from 0.27 to 0.02. On the independent Orphanet test (829 drug–rare-disease pairs), the best result was MRR 0.016 and Hit@10 0.03. On BioKG, GCNmax fell from MRR 0.54 (random) to 0.002 on Orphanet. The authors conclude that "random and cold-start splits both overestimate performance" and call for temporal splits. — [Brière et al., bioRxiv 2025](https://www.biorxiv.org/content/10.1101/2025.01.23.634511v3.full)
- **Setup sensitivity.** Bonner et al. (2022) report low KGE scores on Hetionet and BioKG, for example ComplEx at about 0.012 on BioKG. A 2023 re-evaluation on the same data and splits got ComplEx 0.793, RotatE 0.618 and TransE 0.474 on BioKG, attributing the gap to setup and hyperparameters. — [Bonner et al., arXiv 2105.10488](https://arxiv.org/pdf/2105.10488); [re-evaluation, arXiv 2305.19979](https://arxiv.org/pdf/2305.19979)
- In OREVID's PrimeKG benchmark, RotatE scored below the popularity baseline on zero-shot diseases (Recall@100 0.289 vs 0.358). It was slightly above popularity on external Open Targets approvals (0.156 vs 0.130). — [OREVID GitHub](https://github.com/orevid-org/orevid)
- **DREAMwalk** (Nat Commun 2023) is random-split 10×10-fold CV on MSI, Hetionet and KEGG with random negatives. Average AUROC: DREAMwalk 0.938, best walk baseline (NEWMIN) 0.913, best KGE (ComplEx) 0.833, best GNN (WalkPool) 0.827. On a disease-held-out split by MeSH category (MSI only), DREAMwalk beats baselines by about 6%, with no exact values given. — [Bang et al., Nat Commun 2023 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10272215/)
- **DRKG** (Amazon) has 97,238 entities of 13 types and 5,874,261 triples of 107 edge types. Sources: DrugBank, Hetionet, GNBR, STRING, IntAct, DGIdb and COVID literature. Code is Apache-2.0, but each source keeps its own licence. Pretrained TransE_l2 embeddings (dimension 400) are downloadable. It includes drug–disease "treats" edges from DrugBank and Hetionet, a leakage risk. — [DRKG GitHub](https://github.com/gnn4dr/DRKG)
- On Hetionet, PubMedBERT text embeddings beat four retrained KG baselines on AUROC, and the best KG method (RotatE) reached 0.854 (10-fold splits). — [BioNLP 2026](https://aclanthology.org/2026.bionlp-1.13/)

### Inferences
- Random-split results mainly measure memorisation of each disease's own indication neighbourhood and node degree. Our leakage rule is effectively a disease cold-start split, and there the published KGE numbers fall by 3–10×.
- Pretrained DRKG or Hetionet embeddings embed "treats" edges for our test diseases. Using them would leak unless retrained without those edges, which is CPU-feasible with DGL-KE or PyKEEN on a filtered graph but uncertain in a day, and the expected gain is low.
- Any score we add must be compared against a degree-only baseline: how many diseases each drug is approved for, computed without the target disease.

### Gaps
- I found no single paper reporting random vs disease-held-out Hits@k for TransE, RotatE and ComplEx on one drug–disease benchmark. Bonner et al.'s random-edge results were not extracted.

## 3. Simple strong baselines: drug–drug similarity, disease–disease similarity transfer, popularity, and how they compare

### Takeaway
"Drugs already approved for related diseases" (disease-similarity transfer) is the strongest cheap signal in recent benchmarks. OREVID attributes most of its 2× gain over TxGNN to related-disease transfer plus ranking. A drug acting on a disease gene with no other evidence was right only 1.8–3.4% of the time. Popularity (number of other approved indications) is a baseline that fancy models often barely beat. Semantic (ontology) similarity was the largest single contributor in DREAMwalk.

### Cited Findings
- Popularity baseline Recall@100: 0.358 on zero-shot PrimeKG diseases, 0.203 on hard splits, 0.185 on disease areas and 0.130 on external approvals. TxGNN's figures are 0.412, 0.258, 0.237 and 0.121. — [OREVID GitHub](https://github.com/orevid-org/orevid)
- OREVID's ranker uses degree-weighted path counts over metapaths such as "drug targets a disease gene" and "drug treats a disease sharing genes." Its related-disease transfer is "a drug already treating a neighbouring disease in the ontology." It excludes hub genes (linked to ≥500 diseases) from the shared-genes line and reorders by specificity "so drugs scoring high everywhere do not dominate." — [OREVID GitHub](https://github.com/orevid-org/orevid)
- The preprint reports that "a drug acting on a disease gene, with no other evidence, was right 1.8–3.4% of the time." It suggests most signal comes from the ranking and from related diseases rather than shared genes. It also reports low precision on genuinely new indications, about 1 in 20–25. — [OREVID preprint](https://www.preprints.org/frontend/manuscript/6395e853ccac5f68dbff15fb3dcef39f/download_pub)
- DREAMwalk ablation (MSI): semantic-guided teleport gives AUROC 0.944, no teleport 0.905 and random teleport 0.885. The semantic similarity measure "provides the largest performance enhancement." Drug similarity uses ATC, and disease similarity uses MeSH, Disease Ontology or ICD-11 with a 0.4 cutoff. — [Bang et al., Nat Commun 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10272215/)
- In the DREAMwalk bioRxiv version, the best similarity-based baseline (biological plus semantic similarity) had AUROC 0.798, against a GAT GNN at 0.775. — [DREAMwalk bioRxiv](https://www.biorxiv.org/content/10.1101/2022.11.22.517225v1.full.pdf)
- Rephetio's degree-only prior failed out of sample (AUROC 0.541 on DrugCentral). Popularity alone is therefore weak on truly new indications, and specificity matters. — [Himmelstein et al., eLife 2017](https://elifesciences.org/articles/26726)
- A 2026 paper describes guilt-by-association predictions as driven by shared graph neighbourhoods: overlapping protein targets and shared indications. — [Springer 2026](https://link.springer.com/article/10.1007/s44163-026-01303-2)

### Inferences
These are CPU-cheap features that can all be built from local data in hours:
- **Disease-similarity transfer.** Score(d, drug) = Σ over other diseases d′ of sim(d, d′) × [drug approved for d′], always excluding d and its exact synonyms. sim can be MONDO/EFO ontology proximity (Open Targets disease parents and ancestors) or Jaccard overlap of genetic-evidence-only target sets. The "hard" variant should also exclude near-identical diseases, such as d's parent and children, when evaluating.
- **Drug-similarity transfer.** Score(d, drug) = max or mean sim(drug, drug′) over drug′ approved for diseases similar to d, but never d itself. Similarity can be target Jaccard (ChEMBL mechanisms or pChEMBL ≥ 7), ATC level-3/4 sharing (ChEMBL 37), or Morgan-fingerprint Tanimoto (RDKit).
- **Popularity or degree** is a mandatory baseline: the count of other approved indications per drug. A specificity correction, such as z-scoring a drug's score across all diseases, guards against hub drugs like corticosteroids.
- Caution: if "related disease" includes the target disease's ontology parent, and Open Targets propagates indications upward, transfer can leak. Exclude ancestors and descendants of d, or at least report both variants.

### Gaps
- I found no peer-reviewed head-to-head of plain disease-similarity transfer against TxGNN under a disease-held-out split. OREVID's ablations are the closest, and they are a preprint.

## 4. Transcriptomic signature reversal (CMap, LINCS L1000, CLUE): predictive value, reproducibility, access, feasibility

### Takeaway
The evidence for predictive value is weak and reproducibility is poor. Querying CMap 2 with CMap 1-derived signatures recovered the same compounds only 17% of the time. In oncology, reversal scores explained a median 1.6% of drug-sensitivity variance and lost their signal once general anti-proliferative effects were removed. We would also need curated disease signatures and a 473,647-signature matrix. Not recommended for a one-day CPU build.

### Cited Findings
- Lim & Pavlidis (Sci Rep 2021): querying CMap 2 (LINCS L1000) with CMap 1-derived signatures gave a 17% success rate. They blame low differential-expression reproducibility both between and within the two CMaps. Reproducibility depended on concentration and cell-line responsiveness, and comparison with a third dataset was "mutually discordant." — [Lim & Pavlidis, Sci Rep 2021](https://www.nature.com/articles/s41598-021-97005-z); [PMC8413422](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8413422/)
- Koudijs, Böhringer & Guchelaar (Brief Bioinform 2022) tested PRISM 21Q2 responses, LINCS L1000 signatures (10 µM, 6 h and 24 h; 506 drugs) and TCGA tumour-vs-normal signatures. Connectivity scores explained a median R² of 1.6% of drug sensitivity, against 95.5% for mean response in other cell lines. Adding the connectivity score raised R² by a median 0.01%. After correcting for viability, the predictive value disappeared. Earlier claims of 7%, 26% and 16% (Chen et al.) for breast, liver and colon cancer were not reproduced (<4%). — [Koudijs et al., Brief Bioinform 2022 (PMC9851289)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9851289)
- The field lacks standard benchmarks, and contradictory ways of comparing signatures are in use. Unreported pairs are treated as negatives. — [Samart et al., "Reconciling multiple connectivity scores for drug repurposing", arXiv 2009.09317](https://arxiv.org/pdf/2009.09317)
- A 2024 simulation benchmark found extreme cosine and Pearson similarity at least as good as the CMAP2 and CSS scores. It used simulated data and average precision, not real indications. — [Gonzalez Gomez et al., Brief Bioinform 2024 (PMC11210109)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11210109)
- Data size: GEO GSE92742 Level 5 is `GSE92742_Broad_LINCS_Level5_COMPZ.MODZ_n473647x12328.gctx.gz`, holding 473,647 signatures × 12,328 genes. Phase II is GSE70138, and CLUE (clue.io) hosts all five levels. — [signatureSearchData vignette](https://bioconductor.statistik.tu-dortmund.de/packages/3.18/data/experiment/vignettes/signatureSearchData/inst/doc/signatureSearchData.html); [rdrr lincs](https://rdrr.io/github/yduan004/signatureSearch_data/man/lincs.html)

### Inferences
- A reversal score needs a disease signature for each of our diseases, from CREEDS or GEO, and mapping of 1,956 drugs to LINCS perturbagen IDs, where coverage is partial. It also needs about 1 day of data wrangling before any scoring, and the expected gain is near zero. Skip it, or mention it only as future work.
- If it were used, it should be an optional low-weight feature with an explicit "no signature" missing value, never a gate.

### Gaps
- I found no explicit licence text for GSE92742, GSE70138 or CLUE. GEO data are generally public, but the Broad directs licence questions to clue@broadinstitute.org. Verify before redistributing.
- I found no 2018–2026 systematic AUROC benchmark of signature reversal against known non-oncology indications. A CREEDS × CMap/Tahoe-100M preprint exists ([Research Square rs-10606217](https://www.researchsquare.com/article/rs-10606217)), but its metrics were not checked.

## 5. Learning-to-rank and feature ensembles (genetics, association score, proximity, similarity): evidence that ensembles beat single scores, and leakage-free training

### Takeaway
Two independent lines of evidence say combining signals beats any single one. Gysi et al. (PNAS 2021) found that a consensus of AI, diffusion and proximity rankings beat the best individual pipeline. OREVID found that LightGBM LambdaRank over path-count features, with disease masking, roughly doubles TxGNN's zero-shot Recall@100 (the latter is a preprint). Train with grouped cross-validation by disease, hide the held-out disease's own labels when computing its features, and also hold out ontology neighbours for a "hard" score.

### Cited Findings
- Gysi et al. (PNAS 2021) ranked 6,340 drugs for SARS-CoV-2 using AI, diffusion and proximity, validated against 918 drugs screened in VeroE6 cells and against clinical trials. No single algorithm performed consistently across datasets and metrics. "Fusing" all algorithms into a consensus outperformed the best individual pipeline. The top-ranked drugs had a 62% success rate in human cells, against a 0.8% unguided hit rate. — [Gysi et al., PNAS 2021 (arXiv 2004.07229)](https://arxiv.org/abs/2004.07229v2); [NetSci Institute](https://www.networkscienceinstitute.org/publications/network-medicine-framework-for-identifying-drug-repurposing-opportunities-for-covid-19-22)
- OREVID uses LightGBM LambdaRank, then reorders by specificity. "Masked training: the disease's own treatments are hidden while the model learns." It evaluates on zero-shot, hidden disease areas, an external approvals exam and a pre-registered temporal test (2015 graph: OREVID 0.322 vs popularity 0.174 for uses that later reached phase 3 or approval). Its inputs include Open Targets gene–disease evidence, directional mechanisms, clinical stages, stopped trials and STRING. The whole build runs in 2–3 h with about 7 GB of disk on CPU. — [OREVID GitHub](https://github.com/orevid-org/orevid); [OREVID preprint](https://www.preprints.org/frontend/manuscript/6395e853ccac5f68dbff15fb3dcef39f/download_pub)
- Without Open Targets features, OREVID's temporal Recall@100 drops only from 0.283 to 0.271. — [OREVID GitHub](https://github.com/orevid-org/orevid)
- Genetic evidence is a validated prior. Open Targets says two-thirds of FDA 2021 approvals have underlying genetic evidence for the target–disease association. — [Open Targets blog](https://blog.opentargets.org/machine-learning-for-drug-target-identification-and-prioritisation-at-open-targets/)
- Minikel et al. (Nature 2024) estimate that drug mechanisms with genetic support are about 2.6× more likely to succeed clinically. This comes from prior knowledge; the page was not fetched this session, so verify before quoting. — [Minikel et al., Nature 2024](https://www.nature.com/articles/s41586-024-07316-0)

### Inferences
Recommended design for our pipeline, in a day on CPU:
1. **Features per (disease d, drug):**
   - (a) Network proximity (existing).
   - (b) Max and mean genetics-only Open Targets association over the drug's targets. Use datasources such as gwas_credible_sets, gene_burden, eva, genomics_england, orphanet, gene2phenotype and uniprot_literature, and exclude clinical and literature sources (section 6).
   - (c) Disease-similarity transfer and (d) drug-similarity transfer (section 3), with d's own labels hidden.
   - (e) Popularity: the count of other approved indications.
   - (f) A specificity z-score of each feature across diseases.
2. **Model:** LightGBM `LGBMRanker` (LambdaRank) or logistic regression. With 1,956 drugs × N diseases this fits on a laptop in minutes.
3. **Leakage-free training:** use GroupKFold by disease, or leave-one-disease-out. Compute features (c), (d) and (e) inside each fold from training-fold labels only, because transfer features computed from all labels leak the test label through (e) and (c). Also report a "hard" fold that removes the test disease's MONDO ancestors and descendants from the label set.
4. **Simplest ensemble if time is short:** reciprocal-rank fusion or mean of per-feature rank percentiles. No training is needed, and it follows Gysi's consensus finding.
5. **Report against baselines:** Recall@k / Hits@k and AUPRC over the full 1,956-drug list, not sampled negatives, against popularity and proximity alone.

### Gaps
- I found no peer-reviewed paper that specifically trains a learning-to-rank model over Open Targets genetics, proximity and similarity with leave-disease-out validation. OREVID (preprint) is the closest.
- Gysi et al.'s exact consensus vs single-method AUC numbers were not extracted.

## 6. Open Targets drug-related scores and "known drug" features that leak

### Takeaway
Treat any Open Targets field derived from clinical reports or drug mentions as leakage for the target disease. That covers the `clinical_precedence` datasource (formerly the ChEMBL known-drug evidence), `cancer_biomarkers` (rows name the drug), `drugAndClinicalCandidates` / `maxClinicalStage`, ChEMBL `drug_indication`, and plausibly `europepmc` literature co-mentions. The overall association score includes these sources, so recompute it with them zeroed. Our team has already reproduced this effect locally.

### Cited Findings
- The Clinical Precedence datasource "covers any target/disease relationship that can be explained by a drug targeting the gene product." It is built by "joining the drug/disease relationship captured in the clinical report with drug mechanism of action data." Each evidence item is one clinical report, scored by stage from 0.01 (preclinical) to 1.0 (approval), with stopped trials down-weighted. — [Open Targets Platform docs: evidence](https://platform-docs.opentargets.org/evidence)
- Cancer Biomarkers covers "biomarkers of drug sensitivity, resistance, and toxicity for drugs targeting specific targets in cancer," from the Cancer Genome Interpreter, with a fixed score of 0.5. Europe PMC is "target–disease co-occurrences in the literature." — [Open Targets Platform docs: evidence](https://platform-docs.opentargets.org/evidence)
- Internal team finding (Open Targets 26.09):
  - The COVID-19 × baricitinib known-answer check is circular. JAK2's COVID-19 association (0.419) comes only from `clinical_precedence` and `europepmc`, and once clinical evidence is zeroed, baricitinib falls to 22nd.
  - In myeloma, `cancer_biomarkers` rows name the drug ("BCL2 overexpression / VENETOCLAX").
  - The overall score can be reproduced offline as Σ(w·s)/i² ÷ π²/6, which allows ablation.
  - The server-side `datasources:` argument replaces the whole weight table.
  - `maximumClinicalStage: APPROVAL` includes ATC/TTD-only claims; navitoclax is shown as approved.

  — `/Users/jessicamak/conductor/workspaces/ai-drug-discovery/la-paz/.trail/learnings/2026-10-24-open-targets-known-answer-checks-leak-jessica.md` (internal)
- Internal: `knownDrugs` is gone in Open Targets API 26.9.0. Disease drugs come from `disease.drugAndClinicalCandidates`, with stages APPROVAL through EARLY_PHASE_1. Stage lags regulators: baricitinib is still listed at phase 3 for COVID-19. — `/Users/jessicamak/conductor/workspaces/ai-drug-discovery/la-paz/.trail/learnings/2026-10-24-open-targets-dropped-knowndrugs-disease-drugs-abudi.md` (internal)
- OREVID feeds Open Targets "clinical stages, and stopped trials" into its ranker and does not describe removing clinical or known-drug evidence from inputs. This is a possible leakage path in its external Open Targets test, and its results should be read with that in mind. — [OREVID GitHub](https://github.com/orevid-org/orevid)
- In PrimeKG, Rephetio and DRKG, the indication, contraindication and off-label (`treats`) edges come from DrugBank, DrugCentral and PharmacotherapyDB. Any embedding or model trained on the full graph has seen the target disease's approvals. — [Chandak et al. 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC9893183/); [DRKG GitHub](https://github.com/gnn4dr/DRKG); [Himmelstein et al. 2017](https://elifesciences.org/articles/26726)

### Inferences
Leakage checklist for any new score:
- (1) Zero `clinical_precedence`, `cancer_biomarkers` and `europepmc` before using association scores. Europe PMC is a judgment call, because drug-trial papers co-mention target and disease; report with and without it.
- (2) Never use `drugAndClinicalCandidates`, `maxClinicalStage`, ChEMBL `drug_indication` or ChEMBL `max_phase_for_ind` for the target disease. For other diseases they are allowed as transfer labels.
- (3) Watch indirect association propagation. Open Targets indirect scores include evidence from descendant diseases, so a child disease's clinical reports can flow into the parent. Use direct-only scores, or exclude descendants.
- (4) Watch PrimeKG or DRKG `treats` edges and pretrained embeddings.
- (5) Watch Rephetio-style treatment-degree priors that include the target disease's edges.
- (6) For "approved" ground truth, filter to regulator sources (FDA, EMA, PMDA, DailyMed), not ATC or TTD.

### Gaps
- I did not find an Open Targets document that formally lists which datasources count as "known drug" leakage for repurposing benchmarks. The list above combines the docs with our own ablation.
- Whether `europepmc` co-mentions materially inflate held-out ranks across many diseases was not quantified. It has only been shown for COVID-19 × JAK2 internally.
