# Network-medicine methods for ranking approved drugs for a disease (2015-2026)

Scope note: these notes cover network proximity, separation, diffusion/RWR, module expansion, genetic-evidence weighting and benchmark realism. Several primary full texts (Nature, Science) were behind login or bot checks; numbers marked "figure-only" were not readable in text and are listed under Gaps. Pipeline context used for the inferences comes from the brief and from the repo's own learnings (`.trail/learnings/2026-10-25-official-14-shortlist-execution-zaid.md`, `.trail/learnings/2026-10-25-rwr-functional-comparison-zaid.md`). Those are internal results, not literature.

## Q1. What did Guney 2016, Cheng 2018/2019, Morselli Gysi 2021 and Menche 2015 report, with numbers, and on which interactome?

### Takeaway
On curated, literature-integrated interactomes (about 13k proteins and 141k edges for Menche/Guney; 16.7k proteins and 244k edges for Cheng 2018; 18.5k proteins and about 330k edges for Morselli Gysi 2021), closest-distance proximity gives only modest discrimination of known indications: AUROC about 0.63-0.70 in independent re-benchmarks. Cheng 2018 reports "over 70%" on cardiovascular drugs. Against experimental COVID screens it gave AUC 0.57-0.63, with about 7-9 hits in the top 100 of 6,340 drugs. No single method dominated, and simple target-overlap is a strong baseline.

### Cited Findings
**Guney et al. 2016, Nat Commun ("Network-based in silico drug efficacy screening")**
- Interactome: 13,329 proteins and 141,150 interactions. This is the largest connected component of the Menche et al. integrated interactome, built from TRANSFAC, IntAct, MINT, BioGRID, HPRD, KEGG, BIGG, CORUM, PhosphoSitePlus and a signalling network. Mean degree is 21.2. — [Guney 2016, PMC4740350](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/)
- Disease genes came from OMIM (via UniProtKB) and the GWAS catalog (via PheGenI, P < 5×10⁻⁸). Diseases needed at least 20 disease genes in the interactome, which left 78 diseases. — [Guney 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/)
- Drug targets were DrugBank (July 2013) FDA-approved drugs, pharmacological targets only. That gave 238 drugs and 384 targets, with a mean of 3.5 targets per drug and a mean target degree of 28.6. There were 402 known drug-disease pairs and 18,162 unknown pairs, and unknown pairs were treated as negatives. — [Guney 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/)
- Of five distance measures (closest, shortest, kernel, centre, separation), closest was best. Its DeLong P values against the others ranged from 5.1×10⁻⁷ to 4.7×10⁻⁴. The AUC values themselves appear only in Fig. 2a. — [Guney 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/)
- The z-score uses 1,000 size- and degree-matched randomisations of both target and disease sets, with degree bins of at least 100 nodes. "Proximal" means z ≤ −0.15 and "significantly proximal" means z ≤ −2. 59% of known pairs were proximal versus 40% of unknown pairs (OR 2.1). At z ≤ −2 there were 79 of 402 known pairs (OR 5.2). — [Guney 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/)
- Simple baseline: 15.4% of known pairs (62/402) have a drug target that is itself a disease gene, versus 2.7% of unknown pairs (OR 6.6, P = 5.2×10⁻²⁷). The direct-overlap signal is stronger per pair than the proximity signal, but it covers only a minority of pairs. — [Guney 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/)
- In a similarity-based comparison, target proximity scored AUC 81%. Target identity scored 80% (P = 0.12, so not significantly different), chemical similarity 78%, target PPI 71%, GO 71% and LINCS 65%. Side-effect similarity scored 81% but applies to fewer than half of the pairs. — [Guney 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/)
- Degree bias: raw closest distance correlates with degree (ρ = −0.46, P = 8.6×10⁻²³). The z-score removes this (ρ = −0.01). — [Guney 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/)
- Interactome choice: the integrated interactome captured therapeutic effects better than STRING and better than high-throughput binary screens. The numbers are only in Supplementary Table 2. — [Guney 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/)

**Independent re-benchmark of proximity (Guala and Sonnhammer 2022, Front Genet)**
- On Guney's own benchmark and interactome (402 positives, 18,162 negatives), proximity scored AUROC 0.677. BinoX scored 0.714, ANUBIX 0.667 and NEAT 0.657. — [Guala and Sonnhammer 2022](https://www.frontiersin.org/journals/genetics/articles/10.3389/fgene.2022.792090/full)
- On a time-stamped benchmark (drugs that later gained an indication; 764 positives and 17,327 negatives), proximity scored AUROC 0.633 and recall 0.425 (0.351 on the new positives only). BinoX and NEAT fell to about 0.54. — [Guala and Sonnhammer 2022](https://www.frontiersin.org/journals/genetics/articles/10.3389/fgene.2022.792090/full)
- On the FunCoup 5 network (12,848 proteins and 612,284 links at confidence 0.8) with CTD labels ("FCbench", 8,518 positives), proximity scored AUROC 0.868. Network and label effects are confounded here. FCbench removed negatives that had target-gene overlap. — [Guala and Sonnhammer 2022](https://www.frontiersin.org/journals/genetics/articles/10.3389/fgene.2022.792090/full)

**Cheng et al. 2018, Nat Commun (population-based validation, cardiovascular outcomes)**
- Interactome: 243,603 PPIs among 16,677 proteins. Sources were binary Y2H, kinase-substrate, 3D-structure, signalling and literature-curated AP-MS/Y2H data from about 15 databases. Inferred data (evolutionary, expression, metabolic) were excluded. — [Cheng 2018, PMC6043492](https://pmc.ncbi.nlm.nih.gov/articles/PMC6043492/)
- Drug targets came from DrugBank, TTD, PharmGKB, ChEMBL, BindingDB and IUPHAR, with a bioactivity cutoff of ≤10 µM (Ki, Kd, EC50 or IC50). This is a looser expansion than a pChEMBL ≥ 7 cutoff. — [Cheng 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6043492/)
- The study covered 984 FDA-approved drugs (177 cardiovascular, 807 not) and 23 cardiovascular outcomes, each needing at least 10 disease genes. Disease genes came from OMIM, CTD, HuGE Navigator, DisGeNET, ClinVar, GWAS Catalog, GWASdb and the PheWAS Catalog. — [Cheng 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6043492/)
- Proximity recovered the 177 cardiovascular drugs with "AUC over 70%". Per-disease AUCs are supplementary only. Closest-distance z beat shortest, kernel and centre. The high-confidence threshold was z < −4. — [Cheng 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6043492/)
- Sobering detail: only 2 of 4 predictions validated in more than 220M patients (carbamazepine with CAD risk, HR 1.56; hydroxychloroquine, HR 0.76). Lithium-stroke was inconsistent across databases (HR 1.02 vs 0.48), and mesalamine-CAD was not significant. One highlighted pair (carbamazepine-CAD, z = −2.36) did not meet the stated z < −4 threshold. — [Cheng 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6043492/)

**Cheng, Kovács and Barabási 2019, Nat Commun (drug combinations, separation)**
- Combinations fall into six network classes. Only one class, "Complementary Exposure", correlated with efficacy in approved hypertension and cancer combinations. In that class, both drugs' targets hit the disease module but sit in separate neighbourhoods (separation s_AB ≥ 0). — [Cheng 2019, PubMed 30867426](https://pubmed.ncbi.nlm.nih.gov/30867426/); [PMC6416394](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6416394/)
- A secondary source reports about 59% accuracy for this predictor on hypertension combinations. This is unverified against the primary paper. — [Frontiers Pharmacol 2021](https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2021.634097/pdf)

**Morselli Gysi et al. 2021, PNAS (COVID-19 network medicine framework)**
- Interactome: 18,508 proteins and 332,749 interactions from 21 databases. The Methods give a slightly different 18,505 and 327,924. The disease module was 332 SARS-CoV-2 host proteins, of which 208 form the LCC. Twelve pipelines (4 AI, 5 diffusion, 3 proximity) each ranked 6,340 DrugBank drugs. — [Morselli Gysi 2021, PMC8126852](https://pmc.ncbi.nlm.nih.gov/articles/PMC8126852)
- The VeroE6 screen (E918) had 918 drugs with 77 positives. Proximity P1 scored AUC 0.63 (the best here), while P2 and P3 scored 0.58. — [Morselli Gysi 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8126852)
- On drugs in clinical trials (CT415, 67 drugs), the AI pipelines scored AUC 0.73-0.76 and proximity 0.56-0.57. The CT ground truth likely rewards "popular" drugs, which favours knowledge-graph AI. — [Morselli Gysi 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8126852)
- Top-100 of 6,340 on E918: A2 found 9 positives (recall 11.7%) and P1 found 7 (recall 9%). — [Morselli Gysi 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8126852)
- Diffusion AUCs (D1-D5) appear in figures only. "No single predictive algorithm" was consistently reliable: proximity won on E918 and AI won on CT. — [Morselli Gysi 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8126852)
- Ensembling: Average Rank was worst. Borda was strong on E918 but not on CT. CRank was consistently good, with a top-100 hit rate of 9% and 58 of 77 positives in its top 800. — [Morselli Gysi 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8126852)
- Prospective validation: 13 of the top 200 CRank drugs were positive in VeroE6. The headline "62% success vs 0.8% unguided" refers to drugs passing both cell screens. — [Morselli Gysi 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8126852)

**Menche et al. 2015, Science (disease modules)**
- The interactome had 13,460 proteins and 141,296 binary interactions from seven source types. Menche describes current maps as covering less than 20% of potential interactions ("80% incomplete"). This is reported via a secondary paper that reuses it. — [PMC5260043 (uses Menche interactome)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5260043)
- Menche derives conditions under which disease modules are detectable despite incompleteness, and defines separation s_AB = ⟨d_AB⟩ − (⟨d_AA⟩ + ⟨d_BB⟩)/2. Overlapping modules (s_AB < 0) show coexpression, symptom similarity and comorbidity; separated modules are phenotypically distinct. — [Menche 2015, PubMed 25700523](https://pubmed.ncbi.nlm.nih.gov/25700523/); [NSI summary](https://www.networkscienceinstitute.org/publications/uncovering-disease-disease-relationships-through-the-incomplete-interactome)

**Multiscale interactome (Ruiz, Cho, Leskovec 2021, Nat Commun)**
- A random walk over PPI plus a GO biological-function hierarchy scored AUROC 0.674 vs 0.620 for proximity, average precision 0.078 vs 0.065, and Recall@50 0.317 vs 0.264. These are held-out 5-fold CV results. Code and data are at snap-stanford/multiscale-interactome. — [Multiscale interactome supplement](https://zitniklab.hms.harvard.edu/publications/papers/multiscaleinteractomes-ncomms21-supp.pdf); [lab note](https://zitniklab.hms.harvard.edu/2021/03/11/multiscale-interactome-published)

### Inferences
- The best published proximity numbers come from curated interactomes, OMIM/GWAS disease genes with at least 10-20 genes, and pharmacological (primary) targets. Our pipeline differs on all three axes.
- Realistic proximity AUROC is about 0.62-0.68 on held-out or time-split data. Even an AUROC of 0.68 implies weak top-k enrichment when about 21 references are spread over 1,956 candidates (293 references over 14 diseases in our run).
- Random Recall@15 is about 15/1956 ≈ 0.8%. Our 5-7% is therefore roughly 6-9× random, not literally chance. However, the achievable ceiling is reduced because 64 of 293 references were unscorable (no retained targets).
- Morselli Gysi's top-100 recall of 9-12% out of 6,340 drugs is in the same order of magnitude as our Recall@15 of 5-7% out of 1,956. Our result is roughly in line with the literature rather than an outlier.
- Guney's own data says target-disease overlap (OR 6.6) is a strong baseline. Our internal "direct evidence" baseline beat the z-score (Recall@20 0.217 vs 0.145 on 11 diseases), which is consistent with this.

### Gaps
- Exact AUC values for Guney's Fig. 2a measures and for the STRING-vs-integrated comparison (Supplementary Table 2) could not be read; nature.com redirected to login.
- Cheng 2018 per-disease AUCs are supplementary only. The primary Cheng 2019 accuracy figure could not be verified.
- The Menche 2015 primary full text (226 diseases with at least 20 genes, the module-detectability threshold) was not retrieved. The disease count is from memory and is not cited.
- Morselli Gysi diffusion-pipeline AUCs are figure-only.

## Q2. How sensitive are results to interactome choice, disease-gene set definition, and drug-target set?

### Takeaway
The evidence conflicts on interactome choice. Guney found its curated interactome beat STRING for drug-indication recovery. Large benchmarks of disease-gene recovery (Huang 2018; Wright 2024, 45 networks) find bigger composite networks, including STRING, perform best, and performance tracks network size. No study was found that directly tests STRING physical at combined ≥700 plus experiments ≥400, or top-50 Open Targets association lists, for drug proximity. Disease-gene definition is a known weak point: Sadegh 2023 argues that phenotype-defined association data blur network-medicine results.

### Cited Findings
- **Huang et al. 2018 (Cell Systems):** 21 networks were tested on 446 disease gene sets (literature, expression, GWAS). STRING, ConsensusPathDB and GIANT performed best overall. Performance broadly tracked network size: new interactions currently outweigh false positives. After size adjustment, DIP is most efficient. — [Huang 2018 summary (UCSD)](https://bioinformatics.ucsd.edu/node/22651); [PMC5920724](https://pmc.ncbi.nlm.nih.gov/articles/PMC5920724)
- **Wright et al. 2024 (Mol Syst Biol), "State of the Interactomes":** 45 interactomes were evaluated. HumanNet, STRING and FunCoup were most effective for disease genes. STRING was best for GWAS-derived (genetic) sets and HumanNet for literature sets. — [Wright 2024, PMC11697402](https://pmc.ncbi.nlm.nih.gov/articles/PMC11697402)
- Wright 2024 also found gene-set recovery "highly correlated" with interaction count. The effect weakened but persisted after controlling for gene coverage (P = 8.8×10⁻³⁴ literature; 4.1×10⁻⁶ genetic). — [Wright 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11697402)
- Wright 2024 did not report STRING threshold sweeps. It noted that a co-citation-free STRING is "less powerful" but still strong. HuRI is recommended only for coverage, not disease prioritisation. — [Wright 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11697402)
- Wright 2024 recommends PCNet2.0 (the top 15 interactomes, 3.85M interactions) for disease gene sets; 2.2 is a co-citation-free variant with 3.32M interactions. These are distributed via NDEx. — [Wright 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11697402)
- Conflict: Guney 2016 reports that the curated integrated interactome captured therapeutic effects better than STRING and high-throughput binary screens (Supplementary Table 2). — [Guney 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/). This conflicts with the size-favours-performance result of [Huang 2018](https://bioinformatics.ucsd.edu/node/22651) and [Wright 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11697402). The tasks differ (drug indications vs disease-gene recovery), and the STRING version and threshold in Guney are not known.
- Guala and Sonnhammer observed that "all methods performed much better" on FunCoup with 612k links, and proximity AUROC rose from 0.677 to 0.868. Benchmark labels changed at the same time, so this is not a clean network effect. — [Guala and Sonnhammer 2022](https://www.frontiersin.org/journals/genetics/articles/10.3389/fgene.2022.792090/full)
- Barrio-Hernandez 2023 (Nat Genet) used IntAct, Reactome and SIGNOR plus STRING v11 at edge score ≥0.75 (18,410 nodes and 571,917 edges). This combined network matched the larger PCNet for recovering disease genes and ChEMBL drug targets, with average AUC > 0.7. — [Barrio-Hernandez 2023, PMC10011132](https://pmc.ncbi.nlm.nih.gov/articles/PMC10011132/)
- **Disease-gene definitions:** Sadegh et al. 2023 (Nat Commun 14:1662) show that phenotype-based disease definitions in large association datasets bias network-medicine analyses and produce "a blurred view on disease mechanisms". They urge caution when mining such data. — [Sadegh 2023 record](https://cris.fau.de/publications/295401656); [DOAJ](https://doaj.org/article/f94efe6e0688493fa30f8c9113b32eb9)
- Guney required at least 20 disease genes, all from OMIM and genome-wide-significant GWAS. — [Guney 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/). Cheng 2018 required at least 10 genes from 8 curated sources. — [Cheng 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6043492/). Neither tested a fixed top-N cutoff on association scores.
- **Drug targets:** Guney used pharmacological targets only, a mean of 3.5 per drug. — [Guney 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/). Cheng 2018 expanded to ≤10 µM bioactivity across six databases. — [Cheng 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6043492/). In Minikel 2024, restricting to single-target drugs gave "very similar results" for genetic-support RS. — [Minikel 2024, Europe PMC full text](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11096124/fullTextXML)
- An edge-weighted proximity study in Parkinson's disease reported Recall@50 of 0.27 unweighted. This rose to 0.45 when pathway counts were used as edge weights, and to 0.64 with PD-relevant pathway weighting. It is a single-disease, likely tuned-in-sample result. — [ResearchGate: PD pathway-weighted proximity](https://www.researchgate.net/publication/378116304_Drug_repurposing_for_Parkinson's_disease_by_biological_pathway_based_edge-weighted_network_proximity_analysis)
- Internal result: moving from STRING physical (114k edges) to STRING functional c700 (274k edges, LCC 16,963) raised candidate coverage from 66.8% to 70.7%. Recall@20 changed from 0.211 to 0.229 for RWR, and the paired intervals included zero. — repo learning `2026-10-25-rwr-functional-comparison-zaid.md` (internal, not literature)

### Inferences
- **Our STRING physical filter likely loses signal.** At about 114k edges with LCC 12,834 it is Menche-sized but not Menche-composed: it lacks signalling, kinase-substrate and literature-curated binary edges. The experiments ≥400 rule removes much of the curated-database channel. The literature suggests two cheap swaps: a Cheng/Menche-style curated interactome, or a large composite (STRING functional, PCNet2.x, or Barrio-Hernandez-style IntAct + Reactome + SIGNOR + STRING ≥0.75). Expect effects of a few points, not a step change; our own functional-STRING test already showed a small, non-significant gain.
- **The disease side is the most likely culprit.** A top-50 "evidence-only" Open Targets list mixes literature, animal-model, expression and (if not excluded) known-drug evidence. Sadegh 2023 and the curated OMIM/GWAS seeds in Guney and Cheng point to genetics-first seeds of variable size (all genes passing a threshold) rather than a fixed 50. A fixed N forces weakly associated genes into rare-gene diseases and truncates well-studied ones.
- **Bioactivity expansion (pChEMBL ≥ 7 off-targets) inflates target-set size** for promiscuous drugs such as kinase inhibitors and antipsychotics. Under closest-distance this raises the chance of a short path. The degree-matched z partly corrects this, but only for degree, not set size times promiscuity. A cheap ablation is primary mechanism-of-action targets only (ChEMBL mechanisms) versus expanded.

### Gaps
- No published study was found that directly sweeps STRING score thresholds or physical-only filters for drug-indication proximity. The same is true for Open Targets top-N lists.
- No study found that varies disease-gene set size or source for drug proximity. Guney and Oliva 2014 tests related perturbations, but for gene prioritisation. — [search note](https://pmc.ncbi.nlm.nih.gov/articles/PMC3986215)
- The Guney STRING comparison numbers (Supplementary Table 2) were unread.

## Q3. Diffusion variants, module expansion, and known biases (degree/hub and study bias), with corrections

### Takeaway
Diffusion methods (RWR, PPR, multiscale walks, network propagation) give small gains over proximity at best, about +0.05 AUROC in the multiscale interactome paper. Degree/hub bias and study bias are pervasive. Active-module methods largely capture degree effects rather than biology, and the main correction is degree-preserving nulls or permutation-calibrated scores.

### Cited Findings
- Multiscale RWR (PPI plus GO functions) beat PPI-only proximity: AUROC 0.674 vs 0.620, AP 0.078 vs 0.065, Recall@50 0.317 vs 0.264. — [Ruiz 2021 supplement](https://zitniklab.hms.harvard.edu/publications/papers/multiscaleinteractomes-ncomms21-supp.pdf)
- In Morselli Gysi 2021, five diffusion pipelines did not dominate. No single algorithm was reliable across datasets, and CRank rank-fusion was the most consistent. — [Morselli Gysi 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8126852)
- Lazareva et al. 2021 (Brief Bioinform): apart from DOMINO, the tested active-module methods found no more biologically meaningful modules on real PPI networks than on degree-preserving random networks. They mainly capture node degree, and the authors call for degree-bias correction or context-specific networks. — [Lazareva 2021 record](https://cris.fau.de/publications/260103866)
- DIAMOnD (Ghiassian, Menche, Barabási 2015, PLoS Comput Biol) expands disease modules iteratively by connectivity significance. It was derived from the observation that connectivity significance, not density, characterises disease proteins. — [DIAMOnD, PMC4390154](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4390154/)
- Degree bias in proximity: raw closest distance has ρ = −0.46 with degree, and the degree-binned z-score removes it (ρ = −0.01). — [Guney 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4740350/)
- Study bias: interactome coverage correlates with citation count (r_s = 0.80 across networks; 0.48 for experimental networks only) and with mRNA expression (0.59). Experimental networks skew to highly expressed, conserved genes. — [Wright 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11697402)
- Corrections in practice:
  - Barrio-Hernandez 2023 used a PPR null with 1,000 random seed sets of equal size, giving percentile scores. Benchmark AUCs were compared against degree-preserving node randomisations, and seeds were scored leave-one-out to avoid self-inflation. — [Barrio-Hernandez 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10011132/)
  - Erten et al. 2011 adjust RWR scores post hoc using the candidate's eigenvector centrality. — [Erten 2011, BioData Mining](https://biodatamining.biomedcentral.com/track/pdf/10.1186/1756-0381-4-19)
  - The diffusr package offers a hub-corrected transition matrix. — [diffusr docs](https://rdrr.io/github/dirmeier/diffusr/man/random-walk-methods.html)
- Multiscale interactome-style label weighting: Barrio-Hernandez weighted seeds by L2G score (0.5-1.0). — [Barrio-Hernandez 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10011132/)
- Internal result: RWR raised the macro difference in Recall@15 by +0.018 over the z-score, with 95% CI [−0.006, 0.044] across 14 diseases. On 11 diseases, the raw closest distance (MRR 0.514) beat the degree-corrected z (MRR 0.276). — repo learnings (internal)

### Inferences
- Our finding that **raw distance beats z-score** is consistent with known study and hub bias. Approved-drug targets and well-studied disease genes are hubs, so the degree-matched z removes a "popularity" signal that genuinely predicts membership in a retrospective approved-indication list. On a leakage-controlled, prospective-style test, that popularity signal is partly an artefact. Report both, and do not tune the z away simply because raw wins retrospectively.
- RWR with a uniform restart on 50 seeds and mean mass at drug targets is degree-biased: stationary mass scales with degree. A cheap fix is to score each drug by a percentile against 1,000 degree-matched random target sets, or to divide by the no-restart stationary mass, as Barrio-Hernandez and Erten do.
- Seed weighting is low-cost. Use genetic evidence strength, such as L2G or the Open Targets genetic datatype score, as restart weights instead of a uniform 1/50.
- CRank- or Borda-style fusion of proximity, RWR and direct overlap is the only "ensemble" with published support. Plain average-rank was the worst aggregator in Morselli Gysi.
- **Compute:** all of these run comfortably on a CPU laptop. Our proximity and RWR on a 12.8k-node graph took about 82 s for 14 diseases × 1,956 drugs. DIAMOnD with about 200 iterations, PPR nulls with 1,000 permutations, and multiscale RWR (published code) should all be minutes to under an hour. This is an estimate, not benchmarked.

### Gaps
- No head-to-head published benchmark of hub-corrected vs uncorrected RWR specifically for drug-indication ranking was found.
- DIAMOnD-expanded disease modules have not been benchmarked against raw seeds for drug proximity in the sources read. Whether Lazareva tested DIAMOnD was not confirmed.
- Exact multiscale-interactome main-text numbers were not checked against the supplement figures.

## Q4. Genetic-evidence weighting: do genetically supported targets succeed more, and how to use genetic-only target sets for ranking?

### Takeaway
Yes. Genetic support raises the probability of approval roughly 2-2.6×: Nelson 2015 found about 2×, King 2019 more than 2× when causal genes are clear, and Minikel 2024 found 2.6× overall and 3.7× for OMIM. Network expansion of GWAS genes also enriches for successful targets. This supports re-seeding the disease side with genetics-only Open Targets evidence (OMIM, GWAS/L2G, gene burden) rather than "evidence-only" top-50, and adding a direct genetic-overlap term to the ranker.

### Cited Findings
- **Minikel et al. 2024 (Nature 629:624):**
  - Genetically supported drug mechanisms have 2.6× greater probability of success. — [Minikel 2024 abstract via Europe PMC](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1038/s41586-024-07316-0&resultType=core&format=json)
  - RS was above 2 for every genetic evidence source examined. OMIM was highest at RS 3.7, and IntOGen somatic evidence in oncology was 2.3. — [Minikel 2024 full text](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11096124/fullTextXML)
  - RS is sensitive to the L2G share threshold (main analyses used ≥50%) and to trait-similarity thresholds (0.8). It grows with confidence in the causal gene and is unaffected by effect size (P = 0.90/0.57), MAF (P = 0.26) or discovery year (P = 0.46). — [Minikel 2024](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11096124/fullTextXML)
  - 11 of 17 therapy areas had RS above 2. Haematology, metabolic, respiratory and endocrine were above 3. — [Minikel 2024](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11096124/fullTextXML)
  - Only 7.3% of target-indication pairs had genetic support. For drug-indication pairs, the odds of advancing were 82% higher for supported indications (P = 8.6×10⁻⁷³). — [Minikel 2024](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11096124/fullTextXML)
  - 42 targets with at least 10 launched indications account for 39% of launched target-indication pairs, a concentration that makes "popular target" baselines strong. — [Minikel 2024](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11096124/fullTextXML)
- **King, Davis and Degner 2019 (PLoS Genet):** when causal genes are clear (Mendelian traits, or GWAS hits linked to coding variants), genetic support increases approval more than 2-fold. For Mendelian associations this holds prospectively. Effects are concentrated in phases II-III. GWAS support is somewhat less predictive than Mendelian support, and the two are synergistic. — [King 2019, PMC6907751](https://pmc.ncbi.nlm.nih.gov/articles/6907751/); [DOAJ record](https://doaj.org/article/64c49fc6d37349d0a171a41b9bbb335d)
- **Nelson et al. 2015 (Nat Genet):** pipeline targets with human genetic disease-association evidence are about twice as likely to lead to approved drugs. This is reported as background in King 2019. — [King 2019 summary](https://doaj.org/article/64c49fc6d37349d0a171a41b9bbb335d)
- **MacNamara et al. 2020 (Sci Rep):** 648 UK Biobank GWAS were studied. Network- and pathway-expanded proxies of direct genetic hits were enriched for clinically successful drug targets. Even naïve guilt-by-association works on specific functional networks (complexes, ligand-receptor pairs), and more sophisticated propagation also works on global PPI networks. — [MacNamara 2020, PMC7708424](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7708424/); [bioRxiv](https://www.biorxiv.org/content/10.1101/2020.04.22.051144.full.pdf)
- Barrio-Hernandez 2023 reports that genes linked by network expansion but outside GWAS loci are still enriched for successful drug targets. Network propagation of L2G-weighted GWAS seeds recovered ChEMBL phase II+ targets with average AUC > 0.7, with gold-standard genes overlapping GWAS genes removed to avoid circularity. — [Barrio-Hernandez 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10011132/); [bioRxiv](https://www.biorxiv.org/content/10.1101/2021.07.19.452924.full.pdf)

### Inferences
- **Concrete change:** build disease seeds from Open Targets genetic datatypes only (genetic_association: GWAS credible sets/L2G, gene burden, ClinVar/OMIM-like evidence; plus somatic for cancers). Exclude known_drug (ChEMBL), literature and animal models, and use a score threshold rather than a fixed top-50.
  - Excluding known_drug is also the main anti-leakage step: ChEMBL clinical-precedence evidence encodes the answer.
  - The repo has a learning titled "open-targets-known-answer-checks-leak", consistent with this concern.
- **Add a direct genetic-target term:** does any drug target equal a genetically supported gene, weighted by L2G/OMIM confidence? Guney's OR 6.6 for overlap and Minikel's RS 2.6-3.7 suggest this term alone may match or beat proximity. Our internal "direct evidence" baseline already does.
- **Use network expansion of genetic seeds as a second tier.** For drugs whose targets are not themselves genetic hits, apply PPR from L2G-weighted seeds with a permutation-percentile score. This is the MacNamara/Barrio-Hernandez recipe and is laptop-feasible.
- **Caveat:** genetic support predicts the phase transition to approval for a target-indication pair. It is not a calibrated score for retrieving approved drugs, and many approved drugs (symptomatic, palliative) act on non-genetic targets. Guney already notes that palliative drugs sit farther from disease modules.

### Gaps
- Per-source RS values for GWAS Catalog, UKBB, FinnGen and Genebass (Minikel Fig. 1b) and the L2G-threshold curve are figure-only.
- No published benchmark was found that uses Open Targets genetics-only seeds specifically for proximity/RWR drug ranking with Recall@k.
- MacNamara odds ratios could not be extracted (PMC bot check; PDF not text-extractable here).

## Q5. What realistic performance should we expect on a held-out, leakage-controlled benchmark? Sobering results

### Takeaway
Expect modest numbers. Proximity gives AUROC about 0.62-0.68 on held-out or time-split indications, and AUC 0.57-0.63 against experimental or clinical COVID ground truth. Top-100 recall is about 9-12% out of 6,340 drugs, and Recall@50 about 0.26-0.32 in 5-fold CV for proximity vs multiscale. Random CV with balanced negatives inflates results severalfold: AUPR above 0.93 vs below 0.24 on the same datasets. Transductive models leak through precomputed embeddings.

### Cited Findings
- Time-split proximity: AUROC 0.633 and recall 0.425 (0.351 on new indications only), vs 0.677 on Guney's original non-temporal benchmark. — [Guala and Sonnhammer 2022](https://www.frontiersin.org/journals/genetics/articles/10.3389/fgene.2022.792090/full)
- COVID: the best proximity pipeline scored AUC 0.63 on the VeroE6 screen and 0.56-0.57 on clinical-trial drugs. Top-100 recall was 9% for proximity and 11.7% for the best AI pipeline. — [Morselli Gysi 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8126852)
- Population validation: 2 of 4 network predictions held up in claims data. — [Cheng 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6043492/)
- Evaluation inflation: a 2025 npj Syst Biol Appl benchmark of 10 heterogeneous-network repurposing methods on 8 datasets found per-disease AUPR all below 0.24 (best average OMC 0.211). Earlier balanced-subset evaluations of the same datasets reported AUPR above 0.93; for example, BNNR on Fdataset gave 0.9515 vs 0.2051. — [Nguyen et al. 2025, PMC12804776](https://pmc.ncbi.nlm.nih.gov/articles/PMC12804776/)
- Leakage via embeddings: node2vec embeddings computed before the train/test split leak test edges in drug-target networks. A simple transductive baseline reaches near-optimal scores because of this, and inductive evaluation is recommended. — [de la Fuente et al. 2023, arXiv 2311.12670](https://arxiv.org/pdf/2311.12670)
- Even ML zero-shot methods report relative, not absolute, gains. TxGNN (Nat Med 2024) reports +49.2% indication-prediction accuracy over 8 baselines under zero-shot evaluation across 17,080 diseases. — [TxGNN, PMC11326339](https://pmc.ncbi.nlm.nih.gov/articles/PMC11326339)
- Network-medicine disease definitions themselves blur mechanism (Sadegh 2023), and active-module methods are near degree-null (Lazareva 2021). — [Sadegh 2023](https://cris.fau.de/publications/295401656); [Lazareva 2021](https://cris.fau.de/publications/260103866)
- Internal context: across 14 diseases, macro Recall@15 was 0.051 for z and 0.069 for RWR (paired CI includes zero). Both methods hit at least one reference in 8 of 14 diseases, and the 64 of 293 references with no retained targets count as misses. — repo learning `2026-10-25-official-14-shortlist-execution-zaid.md` (internal)

### Inferences
- **Rough translation:** with about 21 references per disease among 1,956 candidates, the random Recall@15 is about 0.8%. A proximity method with AUROC about 0.65 would typically put only 1-2 references in a top-15, about 5-10% recall, which is where we are. Published methods do not suggest that Recall@15 of 20-30% is achievable from network proximity alone on a leakage-controlled benchmark. A realistic target after fixes is about 8-15%. This is an extrapolation, not a published number.
- **The biggest levers, in order of expected impact and cost:**
  1. Genetics-only disease seeds with a threshold rather than top-50, excluding known_drug and literature evidence (removes leakage and noise).
  2. A direct target-overlap and genetic-support term, fused with proximity/RWR via CRank- or Borda-style rank fusion rather than plain average rank.
  3. Primary mechanism-of-action targets as the default, with bioactivity expansion as an ablation.
  4. Swap or augment the interactome: a curated Menche/Cheng-style interactome, or a composite such as PCNet2.x, STRING functional, or IntAct + Reactome + SIGNOR + STRING ≥0.75.
  5. Degree-calibrated RWR (permutation percentile).
- **Fix coverage before ranking:** 22% of references (64/293) are unscorable. Adding mechanism targets or relaxing the pChEMBL threshold for drugs with no retained targets raises the ceiling directly.
- **Evaluation hygiene:**
  - Keep time-split or disease-held-out designs.
  - Never use Open Targets known_drug evidence for seeds.
  - Report Recall@k with per-disease bootstrap CIs (as done), plus an always-on "popular target / drug degree" baseline. Per Minikel, 42 targets carry 39% of launched indications, so popularity alone may rival the network methods retrospectively.
- **Licences and availability:**
  - STRING is CC BY 4.0 (per brief).
  - The Cheng 2019 and Guney interactomes were released as supplementary data with open-access Nat Commun papers. Licence terms were not verified.
  - HuRI is downloadable from interactome-atlas.org, IntAct (IM-25472) and NDEx, with licence terms not verified. HuRI covers about 53k binary PPIs, and Wright 2024 does not recommend it for disease prioritisation. — [HuRI, PMC7169983](https://pmc.ncbi.nlm.nih.gov/articles/PMC7169983); [Wright 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11697402)
  - PCNet2.x is on NDEx. — [Wright 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11697402)
  - The MacNamara preprint is CC BY-NC 4.0. — [bioRxiv](https://www.biorxiv.org/content/10.1101/2020.04.22.051144.full.pdf)

### Gaps
- No published leakage-controlled benchmark reports Recall@15 for proximity or RWR on approved-drug retrieval with Open Targets-derived seeds. The 8-15% expectation above is an inference.
- The exact TxGNN evaluation protocol was not read. Its numbers are relative improvements, not absolute recall.
- Licence terms for HuRI, the Menche/Guney interactome and the Cheng 2019 interactome were not verified on source pages.
- No source quantifies how much Open Targets known_drug or literature evidence leaks into indication benchmarks. The concern rests on construction logic and on the repo's own learning.
