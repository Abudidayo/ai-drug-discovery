# KG-Bench (Bioinformatics 42(5), btag159): what it benchmarks, and an honest 24-hour evaluation for the OxHack '26 repurposing app

> **Older research snapshot.** Where this note differs from `plan.md`, follow `plan.md`. In particular: docking runs AutoDock Vina on CPU (no rented GPUs), the Model jury uses three Snowflake Cortex model families (no Gemini), and IDs are mapped through UniProt and Ensembl IDs, never gene symbols.


## What is the paper and what exactly does it benchmark?

### Takeaway
btag159 is **"KG-Bench: Benchmarking Graph Neural Network Algorithms for Drug Repurposing"** by Siqi Wei, Christo Sasi, Jelle Piepenbrock, Martijn A. Huynen, Peter A. C. 't Hoen and the SIMPATHIC consortium (Radboud University / Radboudumc, Nijmegen). It was published online on 8 May 2026 in *Bioinformatics* 42(5). It benchmarks **six graph neural network (GNN) architectures on one task**: predicting drug–disease links in a knowledge graph built from Open Targets, using a time split based on Open Targets releases. It does **not** evaluate LLMs, docking or pose generation, or any non-GNN baseline.

### Cited Findings
- **Title and authors.** Siqi Wei, Christo Sasi, Jelle Piepenbrock, Martijn A. Huynen, Peter A. C. 't Hoen, plus the "SIMPATHIC Consortium" as a group author. Affiliations are Radboud University Medical Center and Radboud University, Nijmegen, NL. The corresponding author is P. A. C. 't Hoen. — [Crossref record](https://api.crossref.org/works/10.1093/bioinformatics/btag159); [PMC full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Identifiers.** DOI 10.1093/bioinformatics/btag159; PMID 42103971; PMCID PMC13171177; volume 42, issue 5, article number btag159. Open access under CC BY 4.0. — [PubMed](https://pubmed.ncbi.nlm.nih.gov/42103971/); [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Dates.** Received 24 Sep 2025, revised 18 Mar 2026, accepted 23 Mar 2026. Crossref "published-online" and PMC epub are both 2026-05-08. PubMed's summary instead gives pubdate "2026 May 3" (a minor metadata conflict). — [Crossref](https://api.crossref.org/works/10.1093/bioinformatics/btag159); [PubMed](https://pubmed.ncbi.nlm.nih.gov/42103971/)
- **Funding.** EU Horizon Europe SIMPATHIC project, grant agreement No 101080249. Conflict of interest: "None declared." — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Stated scope (abstract).** "a graph neural network (GNN) benchmarking framework designed to systematically compare the performance of different GNN architectures on drug-disease association prediction using the Open Targets dataset." — [DOI](https://doi.org/10.1093/bioinformatics/btag159)
- **Architectures.** GCNConv, GraphSAGE (SAGEConv), TransformerConv, GATConv, GINConv and RGCNConv. All share an inner-product edge decoder on 16-dimensional embeddings (logit z_uv = h_u·h_v) trained with BCEWithLogitsLoss. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Rationale.** Earlier models (LAGCN, HINGRL) differ in knowledge graph, features and training, which makes it "impossible to assess whether performance differences stem from differences in GNN architectures or from data engineering choices". The prior HN-DREP benchmark (Li et al. 2024, *Brief Bioinform* bbae172) used varying hyperparameters and heterogeneous datasets, so "the contribution of the message-passing mechanism itself could not be isolated". KG-Bench therefore fixes the curated, time-stamped knowledge graphs and the hyperparameters. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Other components.** Bias diagnostics, feature and topology ablations, GNNExplainer attribution with random-baseline and faithfulness tests, and one case study (anakinra → chronic bronchitis). — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Related work the paper cites.** TxGNN (Huang et al. 2024, *Nat Med*) "addressed this kind of issue [one-shot / under-represented diseases] by incorporating disease similarity". Schuler et al. 2022 (*Drug Discov Today*) is cited on evaluating repurposing technologies. Ochoa et al. 2022 found that "33 out of 50 (66%) drugs approved by the FDA … in 2021" had genetic or related target–indication support in Open Targets. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **The preprint is materially different.** bioRxiv 10.1101/2025.10.13.682003 (posted 14 Oct 2025) benchmarked only three GNNs (GCN, GraphSAGE, TransformerConv) with two layers. Its abstract says "TransformerConv achieved the highest performance (APR: 0.87)". — [bioRxiv PDF](https://www.biorxiv.org/content/10.1101/2025.10.13.682003.full.pdf)
- **How the text was obtained.** The OUP PDF URL (`academic.oup.com/.../btag159.pdf`) returned HTTP 403 to an automated fetch on 24 Oct 2026. The published full text was therefore read from PMC JATS XML, and the supplementary files (Supplementary_materials.pdf, Appendix.pdf) came from Europe PMC. — [OUP PDF](https://academic.oup.com/bioinformatics/article-pdf/42/5/btag159/68257186/btag159.pdf); [Europe PMC supplementary files](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13171177/supplementaryFiles)

### Inferences
- Cite only the published (PMC/OUP) version. Its headline result (RGCN best AUC; TransformerConv best F1 at 1:100) replaces the preprint's (TransformerConv best, APR 0.87). Quoting preprint numbers would be an error.
- The unit KG-Bench evaluates is a scored (approved drug, disease) pair, which is the same object our app ranks. Its **time-split and leakage methodology transfers directly** to our evidence ranking and LLM jury, even though its models (GNNs) do not.
- Nothing in it validates docking or pose generation. Any docking check needs a separate reference; PoseBusters is used below.

### Gaps
- I did not survey papers citing KG-Bench. Crossref listed 0 citations at indexing (9 May 2026), and I did not re-check this.
- No LLM-based repurposing benchmark that uses the KG-Bench split was found. I did not search exhaustively.

## Which datasets, splits and metrics does it use, and how does it handle leakage or time-splitting?

### Takeaway
Everything comes from Open Targets Platform releases:
- **Training:** the knowledge graph built from release **21.06**, containing 996 drug–disease edges.
- **Validation:** drug–disease edges **new in 23.06** ("just over 400").
- **Test:** edges **new in 24.06**.
- The node set is frozen to the 21.06 graph.

Leakage controls are parent-molecule deduplication, leaf-only disease terms, removal of non-disease ontology terms, and strict separation of edges between splits. Negatives are random unlinked pairs: 1:1 for training and validation, and 1:1, 1:10 and 1:100 for test. Metrics are AUC, APR and F1 with 95% CIs from a 1000-resample bootstrap.

There are two blind spots that matter for us:
1. Random negatives are far lower-degree than positives, so AUC partly rewards popularity.
2. Disease–target edges use *overall* Open Targets association scores. In current Open Targets data these include clinical-precedence evidence, which is a possible leak the paper does not discuss.

### Cited Findings
**Data sources and graph**
- **Releases used.** Training 21.06 (`indication`, `molecule`, `disease`, `target`, `associationByOverallDirect`). Validation 23.06 (`indication` only). Test 24.06 (`indication` only). — [README](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/README.md)
- **Node types.**
  - Drugs: ChEMBL IDs. Only approved drugs are kept, defined as "a clinical trial max phase value of 4 for at least one indication".
  - Drug types.
  - Targets/genes: Ensembl IDs.
  - Reactome pathways.
  - Diseases: mostly EFO IDs, with cross-references to Orphanet, MONDO and DOID.
  - Therapeutic areas.
  — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Edge types (all undirected).** Drug–disease (indication), drug–target, disease–target (association score), disease–therapeutic area, target–pathway, drug–drug type. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Features.** Drug `blackBoxWarning` (Boolean), drug `yearOfFirstApproval` (normalized), target `bioType` (one-hot), plus a one-hot node-type vector. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Graph size (paper Table 3).** 13,004 nodes and 106,793 edges.
  - Nodes: Drug 1926, Drug type 9, Target 726, Reactome pathway 983, Disease 9336, Therapeutic area 24.
  - Edges: drug–drug type 1926, drug–disease 996, drug–target 3192, gene–pathway 3901, disease–therapeutic area 23,801, disease–target 72,977.
  - Topology: average degree 16.42 (SD 76.93), assortativity −0.133, clustering coefficient 0.011, described as "scale-free".
  — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Highest-degree node.** OTAR_0000018 ("Genetic, Familial or Congenital Disease"), with degree 5,698. — [Supplementary Fig. S1 caption](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13171177/supplementaryFiles)

**Time split**
- **Paper description.** "As a training set, we selected the 2021.06 release of Open Targets, with 996 existing drug-disease edges after the strict data preprocessing criteria … the 2023.06 release as a validation set, with just over 400 newly added drug-disease combinations … As a test set, we used version 2024.06." Nodes are kept fixed and only newly added drug–disease edges for those nodes are used. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Code.** "val = new drug–disease edges in OT 23.06 that weren't in 21.06; test = new drug–disease edges in OT 24.06 that weren't in 21.06 or 23.06." Edges are restricted to the approved drugs in the graph. — [1_create_graph.py](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/scripts/1_create_graph.py)
- **Figure 2 (my approximate reading of the bar chart).** Drug–disease edges newly added since 21.06 are about 10 per release for 2021.09–2022.02. They jump to about 450 at 2022.04, sit at about 430–440 from 2022.09 to 2024.03, and reach about 530 at 2024.06 and 2024.09. — [PMC Fig. 2](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Test-set size.** The published text does not state it. In the preprint's confusion matrices, TP+FN = 126 for every model (e.g. GCN TP 71 + FN 55), implying 126 test positives at that time. — [bioRxiv Table S1](https://www.biorxiv.org/content/10.1101/2025.10.13.682003.full.pdf)

**Leakage controls**
- **Drug deduplication.** "we used the drug parentId only and removed all derivative drugs representing the same chemical entity. For example, sildenafil and sildenafil citrate…" — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/). The code also hard-codes a `REDUNDANT_DRUG_MAPPING` from child to parent ChEMBL IDs (for example, dexamethasone salt forms → CHEMBL384467). — [1_create_graph.py](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/scripts/1_create_graph.py)
- **Disease filtering.**
  - Diseases without therapeutic-area annotations are removed.
  - EFO_0001444 (measurement) is excluded.
  - IDs with prefixes UBERON, ZFA, CL, GO, FBbt and FMA are removed.
  - Only "the most specific level of disease" is kept, and parent IDs are removed.

  — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/). In code, the leaf filter keeps diseases with `len(descendants) == 0`. — [1_create_graph.py](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/scripts/1_create_graph.py)
- **Claimed overall control.** "By removing redundant drug variants, collapsing disease identifiers with a hierarchical relationship, and ensuring strict separation of edges between training, validation and test sets, we provide a benchmark that reflects realistic prediction scenarios." — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Disease–target edges.** Taken from `associationByOverallDirect`, keeping rows with score ≥ 0.01. There is no per-datasource filtering in the graph script. — [1_create_graph.py](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/scripts/1_create_graph.py)
- **What overall scores contain today.** In current Open Targets data (API 26.9.0, data 26.09, queried 24 Oct 2026), the COVID-19–JAK2 overall association of 0.4193 is made up only of `clinical_precedence` 0.6763 and `europepmc` 0.2663. — [Open Targets GraphQL API](https://api.platform.opentargets.org/api/v4/graphql)

**Negatives**
- **Sampling.** "we randomly sampled from the non-existent edges. We used a balanced proportion (ratio positive:negative = 1:1) for training and validation sets … the test set was evaluated at different class imbalance proportions (ratio positive:negative = 1:1, 1:10, and 1:100)." — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Excluding known positives.** In code, test negatives are drawn from all approved-drug × disease pairs minus the union of train, validation and test positives. — [1_create_graph.py](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/scripts/1_create_graph.py)
- **Acknowledged caveat.** "a small fraction of these negatives may represent effective drug-disease combinations that have not been discovered yet … the false positives (FPs) are the most interesting fraction for follow-up research". Random sampling was chosen for "simplicity, neutrality, and methodological consistency". — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)

**Metrics, training and baselines**
- **Metrics.** AUC, APR (the paper's wording: "Average Precision-Recall") and F1, with "95% confidence intervals estimated by percentile bootstrapping with 1000 resamples". The preprint also reported sensitivity, specificity and precision. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/); [bioRxiv](https://www.biorxiv.org/content/10.1101/2025.10.13.682003.full.pdf)
- **F1 threshold.** In code, the decision threshold is the mean predicted probability on the validation set at the best validation loss (`val_threshold = val_probs.mean()`), and it is then reused on test. — [2_train_models.py](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/scripts/2_train_models.py)
- **Hyperparameter sensitivity.** Layers {2, 3, 4} × hidden dimensions {16, 64, 256}, "reported on the validation set (OpenTargets v23.06)". — [Supplementary Table S1](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13171177/supplementaryFiles)
- **Unified configuration.** 3 layers, 16 hidden channels, dropout 0.5, LayerNorm, ReLU, "Adam (learning rate 0.001)", 4 attention heads for Transformer and GAT. — [PMC Table 4](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Repo config differs.** It sets `learning_rate` 0.0005 (also the code default), patience 10, up to 1000 epochs, seed 42. — [config.json](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/config.json)
- **Baselines.** The preprint says "GCNConv is used as the baseline". — [bioRxiv](https://www.biorxiv.org/content/10.1101/2025.10.13.682003.full.pdf)
- **Ablations.** A degree-preserving shuffle of drug–disease edges, "no features", and "node-type features only". — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)

**The paper's own evidence of a degree shortcut**
- **Unexpected AUC trend.** "Counterintuitively, models show improved AUC performance as class imbalance increases." — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Supplementary Table S3 (TransformerConv), at 1:1 / 1:10 / 1:100:**
  - Positive confidence: 0.489 at every ratio.
  - Negative confidence: 0.809 / 0.826 / 0.832.
  - AUC: 0.870 / 0.891 / 0.898.
  - Positive-pair mean degree: 61.300 at every ratio. Negative-pair mean degree: 17.300 / 13.900 / 13.400.

  — [Supplementary](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13171177/supplementaryFiles)
- **No-feature ablation.** Positive edges connect hub nodes ("mean degree 58.2 versus 14.7"), and GCN learns degree correlation (ρ = 0.687). Supplementary Fig. S6 gives RGCN ρ = 0.846, GAT ρ = −0.456, GraphSAGE ρ = −0.157 and Transformer ρ = −0.089. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/); [Supplementary](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13171177/supplementaryFiles)

### Inferences
- **The time split is by Open Targets curation date, not real-world approval date.** The jump of roughly 450 edges at 2022.04, after about 10 per release, looks like a data-pipeline or curation change rather than about 450 real approvals in two months. "New in 24.06" therefore means "newly curated", which can include older approvals. This is weaker than a true prospective split.
- **Random negatives are easy.** They are low-degree and get lower-degree as more are sampled, so AUC partly measures popularity. A trivial degree/popularity baseline would probably score well. The paper reports no such baseline, nor any non-GNN baseline (logistic regression, node2vec, TxGNN). This is my reading of the full text.
- **A leakage path the paper does not discuss.** Disease–target edges use overall association scores with no datasource filter. If the 21.06 scores included ChEMBL/clinical-precedence evidence (as current Open Targets scores do), a drug that was in a phase 2–3 trial for disease D in 2021 would strengthen the D–target edge in the training graph. If that drug was then approved for D by 24.06, the test positive was partly signposted in training.
- **Leaf-only diseases change what can be evaluated.** Diseases with any child term are excluded. Before reusing the split, check that our demo diseases (COVID-19, myeloma) exist as leaf nodes in the KG-Bench graph.

### Gaps
- I did not verify whether `associationByOverallDirect` in 21.06 included ChEMBL evidence. That is very likely given current Open Targets behaviour, but unconfirmed.
- The exact test-set size and negative counts in the published version are not stated in the text, and the Fig. S2 confusion matrices are image-only.
- **Internal inconsistency on training ratios.** The Fig. S2 caption says "Each panel corresponds to a model trained separately under a specific positive:negative ratio". The Methods say training and validation are 1:1 and only the test ratio varies.

## Which methods perform best, and what are the headline numbers?

### Takeaway
- **Balanced (1:1) test:** RGCN is top, with AUC 0.91 [0.87–0.94] (0.908 in the main text), APR 0.92 [0.88–0.95] (0.917 in the main text) and F1 0.82. GAT, Transformer and GIN follow (AUC 0.87–0.89); GCN and SAGE are weakest (0.84–0.85).
- **1:100:** AUC stays at 0.88–0.91 for every model, but APR collapses to 0.16–0.21. TransformerConv has clearly the best F1 (0.28 versus 0.08–0.16), which is the abstract's "robustness under class imbalance" claim.
- **The ranking is fragile.** Gaps are a few AUC points with overlapping CIs, and RGCN was the *weakest* model on validation at the chosen configuration. The durable lessons are about imbalance, graph structure and degree bias, not which GNN wins.

### Cited Findings
- **Abstract.** "Benchmarking six GNN architectures, Relational Graph Convolutional Networks achieved the highest ranking performance (AUC: 0.91), while TransformerConv showed superior robustness under class imbalance (F1: 0.28 at 1:100 positive: negative ratio)". — [DOI](https://doi.org/10.1093/bioinformatics/btag159)
- **Main text.** "RGCN achieved the highest Area Under the Curve (AUC, 0.908) and Average Precision-Recall (APR, 0.917) … followed by attention-based architectures (GAT/Transformer) and MLP-based aggregation (GIN). The uniform convolution (GCN, SAGE) exhibits weaker performance." — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Supplementary Table S2: test set, mean [95% CI].** F1 has no CI. — [Supplementary](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13171177/supplementaryFiles)

| Model | 1:1 AUC | 1:1 APR | 1:1 F1 | 1:10 AUC | 1:10 APR | 1:10 F1 | 1:100 AUC | 1:100 APR | 1:100 F1 |
|---|---|---|---|---|---|---|---|---|---|
| GCNConv | 0.84 [0.79–0.89] | 0.83 [0.76–0.90] | 0.77 | 0.88 [0.84–0.91] | 0.56 [0.47–0.64] | 0.51 | 0.88 [0.84–0.92] | 0.20 [0.14–0.28] | 0.13 |
| SAGEConv | 0.85 [0.81–0.90] | 0.85 [0.78–0.91] | 0.60 | 0.88 [0.85–0.91] | 0.51 [0.42–0.60] | 0.48 | 0.89 [0.86–0.91] | 0.16 [0.10–0.23] | 0.16 |
| TransformerConv | 0.87 [0.83–0.91] | 0.86 [0.80–0.92] | 0.52 | 0.89 [0.86–0.92] | 0.58 [0.49–0.67] | 0.48 | 0.90 [0.87–0.93] | 0.20 [0.14–0.28] | 0.28 |
| GATConv | 0.89 [0.85–0.92] | 0.86 [0.80–0.92] | 0.81 | 0.91 [0.88–0.93] | 0.58 [0.49–0.67] | 0.43 | 0.91 [0.89–0.93] | 0.19 [0.14–0.27] | 0.08 |
| GINConv | 0.87 [0.82–0.91] | 0.85 [0.78–0.91] | 0.81 | 0.90 [0.87–0.93] | 0.57 [0.49–0.67] | 0.49 | 0.90 [0.87–0.93] | 0.17 [0.12–0.25] | 0.10 |
| RGCNConv | 0.91 [0.87–0.94] | 0.92 [0.88–0.95] | 0.82 | 0.91 [0.88–0.94] | 0.65 [0.56–0.73] | 0.44 | 0.91 [0.88–0.94] | 0.21 [0.16–0.29] | 0.08 |

- **Text contradicts Table S2 at 1:100.** The main text says TransformerConv "achieves the highest APR in the scenario with a 1:100 ratio". Table S2 gives RGCN 0.21 [0.16–0.29], ahead of TransformerConv 0.20 [0.14–0.28] and GCN 0.20 [0.14–0.28]. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/) vs [Supplementary](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13171177/supplementaryFiles)
- **Discussion's framing.** "RGCN achieved the highest AUC across all imbalance ratios … TransformerConv exhibited exceptional robustness in F1 scores … a critical performance-reliability tradeoff". — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Validation AUC at the chosen 3-layer / 16-hidden setting (Supplementary Table S1):** GCN 0.882, SAGE 0.890, Transformer 0.902, GAT 0.911, GIN 0.907, RGCN 0.872. The best validation AUC for any configuration was GAT with 2 layers / 16 hidden (0.918). Some configurations collapse: Transformer with 4 layers / 16 hidden scored AUC 0.598, and with 3 layers / 256 hidden scored 0.615. — [Supplementary](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13171177/supplementaryFiles)
- **Ablation (paper Table 5), AUC / APR:**
  - All features + true links: GCN 0.84/0.83, SAGE 0.85/0.85, Transformer 0.87/0.86, GAT 0.89/0.86, GIN 0.87/0.85, RGCN 0.91/0.92.
  - Shuffled links: 0.45–0.51 AUC for every model.
  - No features: GCN 0.83/0.79, SAGE 0.49/0.48, Transformer 0.42/0.46, GAT 0.25/0.40, GIN 0.61/0.62, RGCN 0.86/0.87.
  - Node-type features only: GCN 0.79/0.81, SAGE 0.60/0.58, Transformer 0.65/0.67, GAT 0.69/0.67, GIN 0.60/0.61, RGCN 0.89/0.90.
  - Minor inconsistency: the text quotes the no-feature GCN AUC as 0.82, while the table shows 0.83.

  — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Bias analysis (TransformerConv, published version).**
  - 39% of evaluated pairs involve drugs seen in training and 61% involve unseen drugs.
  - Median scores are 0.399 versus 0.394. For scores > 0.5 the medians are 0.647 versus 0.649.
  - Some drugs are predicted for "more than 2000" diseases.
  - Pearson r = 0.352 [0.347, 0.356]; Spearman ρ = 0.569 [0.565, 0.572]; log–log Pearson r = 0.576 [0.573, 0.580].
  - The authors conclude there is "moderate frequency dependence" but no systematic bias against novel drugs.

  — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **The preprint concluded the opposite on bias.** "approximately 70% of all high-confidence predictions originating from drugs seen during training", with Spearman ρ = 0.61. — [bioRxiv](https://www.biorxiv.org/content/10.1101/2025.10.13.682003.full.pdf)
- **GNNExplainer node-type importance (Table 6), 1-hop / 2-hop:**
  - TherapeuticArea 0.621 / 0.617; DrugType 0.586 / 0.578; Drug 0.388 / 0.384; Disease 0.388 / 0.379; Gene 0.387 / 0.387; Pathway – / 0.382.
  - Faithfulness (performance drop when removing top-attributed versus random nodes): 0.155 ± 0.048 versus 0.048 ± 0.018 at 1-hop, and 0.136 ± 0.052 versus 0.051 ± 0.017 at 2-hop, P < .001.
  - Hub-bias correlation 0.044.

  — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Case study.** Anakinra → chronic bronchitis (score 0.911). IL1R1 appears in 100/100 paths; IL1B in 12%, IL6 in 12% and VEGFA in 11%. Intermediate diseases include IBS (15%), Behçet's (10%) and Hashimoto's (6%). Patent ES2766770T3 (anakinra for bronchiolitis obliterans syndrome) is cited as independent support, "not part of the training data". — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Superseded preprint numbers, for reference only.** TransformerConv at 1:1: AUC 0.87 [0.83–0.91], APR 0.87 [0.82–0.92]. At 1:100: F1 0.14, APR 0.23. GCN AUC at 1:1: 0.76. — [bioRxiv](https://www.biorxiv.org/content/10.1101/2025.10.13.682003.full.pdf)

### Inferences
- **"RGCN wins" is weak evidence.**
  - Margins at 1:1 are +0.02 AUC over GAT, +0.04 over Transformer/GIN and +0.07 over GCN, with overlapping CIs.
  - RGCN ranks last on validation (0.872) but first on test (0.91).
  - RGCN also has the strongest degree correlation (ρ = 0.846), which suggests part of its edge comes from exploiting hubs against easy random negatives.
- **The robust, quotable lesson is about imbalance.** Even purpose-built GNNs evaluated with a time split reach only about 0.16–0.21 average precision at 1:100, and the best F1 is 0.28. Most top-scoring unlabeled pairs do not become curated indications within about three years. That does not make them wrong, but it means "AI-ranked candidate" is a hypothesis, not a finding.
- **Attributions point to coarse categories.** Therapeutic area and drug type dominate, so these models largely reason as "drugs that treat diseases in similar categories". Mechanistic explanations from them should be presented as heuristic.

### Gaps
- There is no comparison to non-GNN baselines or to published state-of-the-art methods such as TxGNN.
- The paper gives no runtime or compute figures.
- Supplementary Fig. S2 (per-model confusion counts) could not be read as text.

## Are the benchmark code and data public, and could a subset be run in under ~2 hours on a laptop or a single GPU?

### Takeaway
**Yes, both are public.** The MIT-licensed GitHub repo has scripts for building the graph, training, testing and GNNExplainer, plus pre-processed tables. The graph is small (about 13–14k nodes), so retraining the six GNNs on CPU or a single GPU within 2 hours looks feasible. That is my estimate; I did not run anything.

**Two traps:**
1. **The honest temporal split still needs raw Open Targets files.** It reads the 23.06 and 24.06 `indication` parquet files. If they are missing, the script falls back to random "splits" whose "positives" are just random unlinked pairs.
2. **The committed processed data does not match the paper's graph counts.** Reproduced numbers may differ from Table S2.

### Cited Findings
- **Repo facts.** `cmbi/Benchmark_GNN_OpenTargets`, MIT licence, Python. Created 2025-04-24, last push 2026-03-06, 2 stars and 2 forks. No GitHub releases or tags. — [GitHub repo](https://github.com/cmbi/Benchmark_GNN_OpenTargets)
- **Availability statement and FAIR claim.** The paper's Data availability section gives only the GitHub URL. The Discussion claims "datasets are assigned persistent identifiers and registered in public repositories". I found no DOI or Zenodo link in the paper or README. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/); [README](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/README.md)
- **Contents.**
  - Scripts: `scripts/1_create_graph.py`, `2_train_models.py`, `3_test_evaluate.py`, `4_explain_predictions.py`, and `run_pipeline.py`.
  - Processed tables: `processed_indications.csv` (10,459,801 bytes), `processed_diseases.csv` (5,445,729), `processed_associations.csv` (5,258,776), `processed_genes.csv` (1,131,127), `processed_molecules.csv` (575,973).
  - Edge tensors and key mappings.

  — [GitHub repo](https://github.com/cmbi/Benchmark_GNN_OpenTargets)
- **Data options in the README.** Option 1 (pre-processed) is "Recommended". Option 2 (raw Open Targets) "Requires ~50 GB free disk space", and for 23.06 and 24.06 "only indication [is] needed". — [README](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/README.md)
- **README is partly stale.** The model table lists six classes, but the feature list still says "GCNConv, GraphSAGE, and TransformerConv". Outputs include `test_results_summary_*.csv` ("AUC, APR, F1, accuracy with bootstrap CIs") and false-positive candidate CSVs. — [README](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/README.md)
- **The silent fallback.** Validation and test edges always come from the raw `indication` paths (default `OT/{version}/indication`). On failure the script prints "WARNING: Could not load temporal data ({e}). Using random splits." and then takes validation and test "positives" from shuffled *unlinked* pairs. — [1_create_graph.py](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/scripts/1_create_graph.py)
- **Committed data counts.**
  - 13,837 nodes: 1,966 drugs, 9 drug types, 1,211 genes, 1,288 Reactome pathways, 9,339 diseases, 24 therapeutic areas.
  - 142,176 edges: 1,116 drug–disease, 3,219 drug–gene, 8,149 gene–Reactome, 23,805 disease–therapeutic area, 103,921 disease–gene.
  - `training_drug_disease_pairs.csv` has 1,116 rows.
  - The processed data was committed on 2025-07-14 ("Add files via upload").

  — [edge_statistics.json](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/processed_data/edges/edge_statistics.json); [mapping_summary.json](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/processed_data/mappings/mapping_summary.json); [commit history](https://github.com/cmbi/Benchmark_GNN_OpenTargets/commits/main)
- **Paper counts, for comparison.** 13,004 nodes, 106,793 edges, 996 drug–disease edges, 1,926 drugs. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- **Dependencies.** torch ≥ 2.0.0, torch-geometric ≥ 2.3.0, torch-scatter ≥ 2.1.0, torch-sparse ≥ 0.6.0, pyarrow, pandas, numpy, scikit-learn, matplotlib, seaborn, plotly, tqdm, transformers ≥ 4.30.0, polars, networkx, scipy. — [requirements.txt](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/requirements.txt)
- **Explainer settings.** `explainer_epochs` 200, `sample_size` 100000, `n_bootstrap` 1000, `max_path_length` 4. — [config.json](https://github.com/cmbi/Benchmark_GNN_OpenTargets/blob/main/config.json)

### Inferences
- **Runtime (estimate, not executed).** A full-batch, 3-layer, 16-dimensional GNN on about 14k nodes and 110–140k edges should train in minutes per model on a laptop CPU, with early stopping at patience 10. Six models plus the test script should fit comfortably within 2 hours. The GNNExplainer step (100k samples, 1000 bootstraps) is the likely slow part and should be skipped.
- **Install risk.** The likeliest time sink is installing `torch-scatter` / `torch-sparse` on Apple Silicon. Allow 30–60 minutes or use the DGX Spark or a Linux GPU box. That recent PyG versions run these layers without those packages is unverified.
- **Minimal reproducible subset.**
  1. Clone the repo.
  2. Download only the 23.06 and 24.06 `indication` parquet files from `ftp.ebi.ac.uk/pub/databases/opentargets/platform/<ver>/output/etl/parquet/indication/`.
  3. Run graph build, then train, then test.
  4. Confirm the log prints "New validation edges" and "New test edges" counts and **no** "Using random splits" warning.
  5. Compare against Table S2, expecting some drift because the committed data differs from the paper's.
- **Value for the hackathon is the method, not re-running GNNs.** Reproducing GNNs is not what wins a demo. The value lies in borrowing the protocol (release-based split, entity deduplication, multiple negative ratios, bootstrap CIs) and quoting the published numbers as context.

### Gaps
- Not executed, per the safety constraint, so runtime and installability are unverified.
- I did not check that the Open Targets FTP still serves the 21.06, 23.06 and 24.06 `indication` parquet files, or how large they are.
- The paper gives no hardware details.

## What concrete evaluation should our app show judges, and what wording should it use, to be credible without overclaiming?

### Takeaway
Show a **small, pre-registered retrospective check** built on KG-Bench's method:
- **Data:** about 30–50 held-out drug–disease pairs (minimum 30). Each true drug is hidden among 19 popularity-matched approved decoy drugs.
- **Masking:** all *direct* evidence for the pair is removed: clinical candidates and trial records, indications, literature, and the clinical-precedence and literature components of association scores.
- **Metrics:** Hits@5, Hits@10 and MRR with bootstrap CIs, against random and popularity baselines, plus jury agreement.

Present baricitinib/COVID-19 explicitly as a **"known-answer sanity check, not a prediction"**. Live Open Targets data already links them through 22 ClinicalTrials.gov records, and the COVID-19–JAK2 association is built *only* from clinical precedence and literature.

For docking, show a **re-docking pose check**: baricitinib into JAK2 (PDB 6WTO or 6VN8), reporting RMSD ≤ 2 Å and PoseBusters validity, with PoseBusters' published DiffDock-versus-Vina numbers as context.

### Cited Findings
These are facts checked on 24 Oct 2026. The recommendations follow in Inferences.

**Live Open Targets checks (API 26.9.0, data release 26.09)**
- **Schema change.** `knownDrugs` is no longer a field on `Disease` (the query errors with "Cannot query field 'knownDrugs' on type 'Disease'"). The replacement, `drugAndClinicalCandidates`, returns rows with `id`, `maxClinicalStage`, `drug` and `clinicalReports` (source, clinicalStage, trialPhase, trialOverallStatus, …). — [Open Targets GraphQL API](https://api.platform.opentargets.org/api/v4/graphql)
- **COVID-19 (MONDO_0100096).** 540 candidate rows by maximum stage: PHASE_3 212, PHASE_2 166, PHASE_2_3 64, UNKNOWN 47, PHASE_1_2 24, PHASE_1 20, EARLY_PHASE_1 6, APPROVAL 1. The only APPROVAL-stage drug is remdesivir. — [Open Targets API](https://api.platform.opentargets.org/api/v4/graphql); [Open Targets COVID-19 page](https://platform.opentargets.org/disease/MONDO_0100096)
- **Baricitinib (CHEMBL2105759) for COVID-19.**
  - `maxClinicalStage` is PHASE_3, from 22 clinical reports, all from ClinicalTrials.gov: PHASE_3 10, PHASE_2_3 4, PHASE_2 2, UNKNOWN 6.
  - The reports include:
    - NCT04421027: "A Randomized, Double-Blind, Placebo-Controlled, Parallel-Group Phase 3 Study of Baricitinib in Patients With COVID-19 Infection".
    - NCT04401579 and NCT04640168: adaptive randomized trials of investigational therapeutics in hospitalized COVID-19.
    - NCT04381936: "Randomised Evaluation of COVID-19 Therapy".
  - Dexamethasone, sarilumab, tocilizumab, molnupiravir, nirmatrelvir, anakinra and tofacitinib are also present, all at PHASE_3.

  — [Open Targets API](https://api.platform.opentargets.org/api/v4/graphql)
- **COVID-19 associations for baricitinib's targets and the original AAK1 hypothesis:**
  - JAK1: overall 0.5396 (`gwas_credible_sets` 0.7130, `clinical_precedence` 0.6762, `europepmc` 0.2541).
  - JAK2: overall 0.4193 (`clinical_precedence` 0.6763, `europepmc` 0.2663).
  - AAK1: overall 0.0231 (`europepmc` 0.1897).
  - `associatedTargets` exposes a `datasources` argument, and rows include per-source `datasourceScores`.

  — [Open Targets API](https://api.platform.opentargets.org/api/v4/graphql)
- **Multiple myeloma ID.** `disease(efoId: "EFO_0001378")` returns null. Search for "multiple myeloma" returns **MONDO_0009693 "plasma cell myeloma"** (and MONDO_0005235 "smoldering plasma cell myeloma"). — [Open Targets API](https://api.platform.opentargets.org/api/v4/graphql); [Open Targets myeloma page](https://platform.opentargets.org/disease/MONDO_0009693)
- **Multiple myeloma candidates.** 553 rows: PHASE_2 205, PHASE_1 129, PHASE_1_2 92, PHASE_3 64, **APPROVAL 38**, UNKNOWN 10, PHASE_2_3 6, IND 5, EARLY_PHASE_1 4. The APPROVAL rows include salt or parent duplicates such as BORTEZOMIB / BORTEZOMIB D-MANNITOL, IXAZOMIB / IXAZOMIB CITRATE, PANOBINOSTAT / PANOBINOSTAT LACTATE, MOTIXAFORTIDE / MOTIXAFORTIDE ACETATE, DOXORUBICIN / DOXORUBICIN HYDROCHLORIDE, and MELPHALAN FLUFENAMIDE / its hydrochloride. — [Open Targets API](https://api.platform.opentargets.org/api/v4/graphql)

**Methodology to borrow from KG-Bench**
- Release-based retrospective splits; parent-molecule deduplication; most-specific disease terms; random negatives at 1:1, 1:10 and 1:100; 1000-resample bootstrap CIs. APR "dropped sharply across all models" as imbalance rose. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13171177/)
- Positives sit on hubs (mean degree 61.3 versus 13.4–17.3 for random negatives). — [Supplementary Table S3](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13171177/supplementaryFiles)

**Structures for a pose check (RCSB)**
- A full-text search for "baricitinib" returns three entries, all with ligand 3JW (baricitinib):
  - **6WTO**: JAK2 JH1, 1.74 Å, released 2021-05-05.
  - **6VN8**: JAK2 JH1, 1.9 Å, released 2021-02-17.
  - **4W9X**: BMP-2-inducible kinase, 2.14 Å, released 2014-09-10.

  — [RCSB 6WTO](https://www.rcsb.org/structure/6WTO); [RCSB 6VN8](https://www.rcsb.org/structure/6VN8); [RCSB 4W9X](https://www.rcsb.org/structure/4W9X)

**PoseBusters context (Buttenschoen, Morris & Deane, *Chem Sci* 2024, Oxford)**
- **Test sets.** Re-docking of 85 Astex Diverse complexes, and of 308 complexes in the PoseBusters Benchmark set ("released from 2021 onwards", not in PDBbind v2020). DiffDock and EquiBind were trained on the "PDBbind 2020 General Set keeping complexes published before 2019 … 17 347 complexes". — [PoseBusters (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10901501/)
- **Astex Diverse set.** RMSD ≤ 2 Å: DiffDock 72%, Gold 67%, TankBind 59%, AutoDock Vina 58%, Uni-Mol 45%. RMSD ≤ 2 Å *and* PB-valid: Gold 64%, Vina 56%, DiffDock 47%, Uni-Mol 12%, DeepDock 11%, TankBind 5.9%. — [PoseBusters (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10901501/)
- **PoseBusters Benchmark set.** "Gold (55%) and AutoDock Vina (58%) perform the best out of the seven methods with (solid coral bars) and without (striped coral bars) considering PB-validity … the best performing DL method, DiffDock (12%), does not compete with the two standard docking methods." — [PoseBusters (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10901501/)
- **What the checks cover.** Bond lengths and angles (25% tolerance), non-bonded internal distances (30%), an energy-ratio test against 50 generated conformers, and protein–ligand clashes (van der Waals ratio threshold 0.75), among others. The authors argue that time-based splits are "insufficient", and that DL methods "perform far better on proteins that are similar to those they were trained on". The tool is a pip package (BSD-3), and the data are on Zenodo (record 8278563). — [PoseBusters (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10901501/); [PoseBusters code](https://github.com/maabuu/posebusters); [PoseBusters data](https://zenodo.org/records/8278563)

### Inferences
Everything in this subsection is my recommendation, not a claim from the paper.

**A. Main evaluation: a "retrospective held-out check" of evidence ranking and the LLM jury**
1. **Choose the held-out positives.**
   - **Fast option, using KG-Bench directly:** take KG-Bench's test positives (indications new in Open Targets 24.06 versus 21.06/23.06; about 126 pairs in the preprint) and sample 30–50 diseases, one positive each. Evidence must be frozen to roughly the 21.06 era, or masked as in step 3.
   - **Caveat for LLM jurors:** approvals curated by mid-2024 very probably predate the jurors' training cutoffs. Report LLM results on this set as "may reflect memorised knowledge".
   - **Stronger but slower option:** use pairs that reached approval after the jurors' published training cutoffs. This needs a diff of two Open Targets releases, because the GraphQL API serves only the latest release.
2. **Choose decoys.**
   - Pick 19 approved drugs per disease that have *no* Open Targets `drugAndClinicalCandidates` row, at any stage, for that disease or its parent/child terms. This reduces false negatives.
   - Match decoys to the positive on popularity (number of approved indications or number of targets). This neutralises the hub shortcut KG-Bench documents (mean degree 61.3 for positives versus 13.4–17.3 for random negatives).
3. **Mask direct evidence for the held-out pair.**
   - Drop the pair's `drugAndClinicalCandidates` and `clinicalReports` rows, ChEMBL indication rows, and literature co-mentions.
   - Recompute any target–disease support from `datasourceScores`, excluding `clinical_precedence` and `europepmc`.
   - For COVID-19 this removes all JAK2 support and leaves JAK1's GWAS signal (0.7130). That remaining signal is the honest, non-circular evidence.
4. **Deduplicate entities as KG-Bench does.** Collapse salts to their parent molecule (see the myeloma pairs above) and collapse disease hierarchies, e.g. plasma cell myeloma versus smoldering plasma cell myeloma.
5. **Make the jury comparison fair.** Give every juror the same evidence packet and use listwise ranking of the 20 candidates. Randomise candidate order and run two permutations to expose position bias. Use temperature 0, and log model IDs and versions.
6. **Pre-register.** Freeze the candidate lists, prompts and model list, and store a hash and timestamp in Tiger Cloud PostgreSQL *before* running. Show judges the frozen record next to the results, including the per-disease misses.
7. **Optional memorisation probe.** Re-run with drug names replaced by anonymised IDs plus their targets and mechanism. A large drop suggests the jury relies on recall rather than evidence.

**B. Metrics and baselines (20 candidates, 1 positive per disease)**
- **Per disease:** Hits@1, Hits@5, Hits@10 and MRR. Chance levels are 0.05, 0.25 and 0.50, and MRR = H₂₀/20 ≈ 3.598/20 ≈ **0.18**.
- **Pooled:** AUROC and AUPRC at the stated 1:19 ratio (chance AUPRC = 0.05). KG-Bench shows the ratio changes APR dramatically (RGCN 0.92 at 1:1 versus 0.21 at 1:100), so always state it and never compare these numbers directly with KG-Bench's AUCs.
- **CIs:** 95% intervals by bootstrapping over diseases, 1000 resamples (KG-Bench's convention).
- **Baselines to show side by side:**
  - Random.
  - Popularity (degree or number of indications).
  - An evidence-only heuristic: the maximum non-clinical, non-literature association score between the disease and the drug's targets.
  - Each individual LLM.
  - Jury consensus (Borda or mean rank).
- **Jury-specific metrics:** agreement via Kendall's W across jurors; whether consensus beats the best single juror; and a per-disease "disagreement" flag surfaced in the UI as "evidence thin or contested".

**C. Minimum sample size and budget**
- **Precision.** With n = 30 diseases, the 95% CI half-width for a ~50% hit rate is about ±0.18. It is about ±0.14 at n = 50 and ±0.10 at n = 100 (normal approximation). For comparison, KG-Bench's roughly 126 test positives gave AUC CIs of about ±0.03–0.05.
- **Beating chance.** With n = 30, Hits@5 needs at least 12/30 to beat chance (one-sided α = 0.05); with n = 50 it needs about 18–19/50. The more meaningful comparison is the paired test against the popularity baseline (McNemar or paired bootstrap).
- **Recommendation.** At least 30 diseases; 50 is better.
- **Call budget.** Listwise ranking is 1 call per disease per juror per permutation, so 50 × 4 jurors × 2 = 400 calls. Pointwise scoring would need 50 × 20 × 4 = 4000 calls.
- **Time estimate.** Roughly 2 hours for data assembly, jury runs, bootstrap and the results panel. This is a planning estimate.

**D. Making the baricitinib demo non-circular**
- **Label it on screen:** "Known-answer check (not a discovery)".
- **Show two views:**
  - *All evidence:* baricitinib ranks high because Open Targets already lists 22 COVID-19 trials, and the JAK2–COVID association comes entirely from clinical precedence and literature.
  - *Direct, clinical and literature evidence masked:* what remains is JAK1 GWAS support only, and AAK1 (the original repurposing hypothesis) has literature-only support (0.0231 overall).
- **Note LLM knowledge.** The jurors almost certainly know this pairing from training, so it cannot count as validation.
- **Don't take approval status from Open Targets.** Open Targets 26.09 shows baricitinib–COVID-19 at maximum stage PHASE_3, not APPROVAL. If the app says "approved for COVID-19", cite the regulator's label instead.
- **Treat already-approved myeloma drugs as retrieval.** Myeloma has 38 APPROVAL-stage rows in Open Targets, so surfacing any of them is retrieval, not repurposing. Exclude them from "repurposing candidates", or badge them "already approved for this disease", after salt deduplication.

**E. Docking and pose check**
- **Procedure.** Re-dock baricitinib (3JW) into 6WTO and/or 6VN8 after removing the crystal ligand. Report top-1 heavy-atom RMSD to the crystal pose (success if ≤ 2 Å) and the PoseBusters PB-valid flag. Do this for both DiffDock and Vina, using a 25 Å cube centred on the crystal ligand for Vina, as in PoseBusters.
- **What it shows.** Both structures were released in 2021, after DiffDock's pre-2019 training cutoff. However, JAK2 kinase almost certainly has close homologues in the training data, so this is an easy, high-similarity case. Call it a "pose-reproduction check on a known complex".
- **Optional mini-benchmark.** If GPU time allows, run 10–20 complexes from the PoseBusters Benchmark set (Zenodo) through both methods and set the results beside PoseBusters' published numbers (DiffDock 12% versus Vina 58% / Gold 55% on 308 post-2021 complexes).
- **Limits to state.** Never present docking scores as affinity or efficacy. Docking into a target chosen for a new disease, e.g. a myeloma target, has no ground-truth pose, so it is a hypothesis visual only.

**F. Wording**
- **Use:** "retrospective check", "held-out pairs", "evidence hidden", "ranked in top 5 of 20", "chance = 25%", "popularity baseline", "models agree/disagree", "hypothesis for further study", "pose consistent with the crystal structure (RMSD x Å)", "small sample; wide confidence interval", "for learning and exploration, not medical advice".
- **Avoid:** "predicts cures", "discovers", "validated", "accurate", "clinically proven", "approved for X" unless regulator-sourced, "binding affinity" or "efficacy" from docking scores, and "beats state of the art" (our task is not comparable to KG-Bench's AUCs).
- **Template result card** (fill placeholders only with real outputs):
  > "Retrospective check, frozen [date] ([hash]): [N] drug–disease approvals first curated in Open Targets after [cutoff], each hidden among 19 popularity-matched approved drugs, with trial, indication and literature evidence removed. The jury consensus ranked the true drug in its top 5 for [k]/[N] diseases ([x]%, 95% CI [a–b]%). Chance is 25%; the popularity baseline is [y]%. LLM jurors may have seen some of these approvals in training data."
- **Context line about KG-Bench:**
  > "A 2026 Bioinformatics benchmark (KG-Bench) found that even specialised graph models reach only about 0.2 average precision when known treatments are outnumbered 100:1 by non-treatments, so we treat every ranked drug as a hypothesis, not an answer."

### Gaps
- I did not research the training cutoffs of the Snowflake Cortex models. The team must look them up to choose post-cutoff positives.
- I did not verify how to obtain historical Open Targets releases in the new (26.x) drug data model, or the FTP dataset names after the `knownDrugs` → `drugAndClinicalCandidates` change.
- The PoseBusters figures are for the original DiffDock (2023); newer DiffDock versions were not checked.
- I found no published evaluation of LLM "juries" on time-split repurposing data, so the protocol above is a reasoned design, not an established standard.
