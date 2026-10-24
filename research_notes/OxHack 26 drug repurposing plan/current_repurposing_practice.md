# How researchers do computational drug repurposing in 2024–2026, and whether the OxHack '26 evidence-first plan is sound

*Reading record (24 Oct 2026). I used primary sources where I could: papers, official repos, Harvard Dataverse metadata, GitHub API and arXiv abstract pages. Session length was about 12 minutes. I downloaded only data, each file into its own new empty directory under `/tmp/dl_*`, and executed nothing from any download. I read the files with `python3 -I`, using scripts kept in `/tmp/scripts_research/`. Files downloaded: the Dataverse metadata JSON for two datasets, the PrimeKG Dataverse README, TxGNN's `nodes.tab` (7.9 MB), the TxGNN README, and the Nature Medicine full-text XML from Europe PMC. I did not download any model checkpoint. Separation rule: **Cited findings** are facts from a named source or checked live today. **Inferences** are my judgement. Anything I could not verify today is marked **(unverified)**.*

---

## Bottom line

- **The evidence-first plan is sound and close to the simplest design that matches current practice.** Genetics-led target evidence plus curated drug–target mechanisms is the only repurposing signal with large-scale evidence that it raises clinical success: genetically supported mechanisms have about 2.6× the probability of success (Minikel et al., *Nature* 2024). It needs no training, and every link it uses is traceable to a record. Production LLM systems (AstraZeneca's Research Assistant, TxAgent, DeepEvidence) all use the same pattern: retrieve database records, give them IDs, let the LLM only explain them.
- **Do not make an RGCN or TxGNN the main ranker.** Both are graph-pattern predictors with leakage-prone evaluations and stale vocabularies. TxGNN does have "plasma cell myeloma" and "type 2 diabetes mellitus" nodes, but it lacks sotorasib, adagrasib, teclistamab and deucravacitinib. Its reproducibility is disputed in open GitHub issues.
- **TxGNN as a labelled extra column is not a cheap add-on today.** No per-disease ranking table is published. The TxGNN Explorer (txgnn.org) returned HTTP 503 on 24 Oct 2026. Getting scores means running a 2020-era stack (Python 3.8, DGL 0.5.2, CUDA) with a 1.5 GB checkpoint. Treat it as an optional, time-boxed stretch goal for someone with a Linux GPU box, or drop it.
- **Cheap changes that add the most:**
  1. Add a "genetically supported target" badge.
  2. Check claims, not only IDs: a valid evidence ID does not prove the sentence is supported.
  3. Present the jury as commentary and disagreement, not as confidence. Several LLMs make correlated errors: in one 2026 study, nine judges carried about two independent votes.
  4. Keep the deterministic score as the final rank.

---

## 1. TxGNN (Huang et al., *Nature Medicine* 2024)

### Takeaway
TxGNN is a graph neural network that scores drug–disease **indication** and **contraindication** links for 17,080 diseases and 7,957 drug candidates. It is trained on a PrimeKG-derived medical knowledge graph and is designed for "zero-shot" diseases with no known treatments. The code is MIT-licensed and the knowledge graph is on Harvard Dataverse under CC0. Pretrained checkpoints are publicly downloadable from Google Drive. **No precomputed per-disease ranking table is published.** The web Explorer that showed rankings is down today. The software stack is old, and independent users report large reproduction gaps.

### Cited findings
- **Paper.** "A foundation model for clinician-centered drug repurposing", *Nat Med* 30, 3601–3613. Published 25 Sep 2024, doi:10.1038/s41591-024-03233-x, PMC11645266, PMID 39322717. The preprint is medRxiv 10.1101/2023.03.19.23287458; its PMC copy is PMC11326339. — [Europe PMC record](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1038/s41591-024-03233-x&format=json); [Nature Medicine](https://www.nature.com/articles/s41591-024-03233-x)
- **What it predicts.** "TxGNN is a unified model for predicting indications and contraindications across 17,080 diseases". Gold labels come from a medical KG "which consists of 9,388 indications and 30,675 contraindications". The KG "comprises 7,957 potential drug-repurposing candidates, ranging from FDA-approved drugs to experimental drugs investigated in ongoing clinical trials". Of the 17,080 diseases, 92% "have no indications". — [Nat Med full text via Europe PMC](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11645266/fullTextXML)
- **Node counts I checked.** TxGNN's `nodes.tab` (Dataverse file 7144482) contains 17,080 disease and 7,957 drug nodes, alongside 27,671 gene/protein, 15,311 phenotype, 28,642 biological-process, 11,169 molecular-function, 4,176 cellular-component, 2,516 pathway, 14,035 anatomy and 818 exposure nodes. Drug nodes use DrugBank IDs (e.g. `DB13928` Semaglutide). — local count with `python3 -I`, 24 Oct 2026
- **Coverage of common diseases (checked 24 Oct 2026, name match on `node_name`).**
  - Present as disease nodes: "plasma cell myeloma" (MONDO 9693, the current MONDO term for multiple myeloma) and "type 2 diabetes mellitus" (MONDO 5148). Subtypes are also present, e.g. "smoldering plasma cell myeloma" and "type 2 diabetes nephropathy".
  - Drugs present: venetoclax, baricitinib, lenalidomide, daratumumab, semaglutide, tirzepatide.
  - Drugs absent: sotorasib, adagrasib, teclistamab, deucravacitinib, elranatamab, talquetamab, belantamab mafodotin, ciltacabtagene autoleucel, idecabtagene vicleucel.
  - A node being present does not mean the graph has the drug's current indication edges. I did not check edges: `kg.csv` is about 0.9–1 GB. — [Dataverse file 7144482](https://dataverse.harvard.edu/api/files/7144482)
- **Code.** github.com/mims-harvard/TxGNN, MIT licence. Created 24 Aug 2022. Last commit 6 May 2024 ("add reproduce info"). 15 commits, no releases, 292 stars, 22 open issues, not archived. — [GitHub API](https://api.github.com/repos/mims-harvard/TxGNN)
- **Install.** The README says: `conda create --name txgnn_env python=3.8`; "Install PyTorch via https://pytorch.org/ with your CUDA versions"; `conda install -c dglteam dgl-cuda{$CUDA_VERSION}==0.5.2`, "as long as it is DGL 0.5.2"; then `pip install TxGNN`. PyG is also needed for the disease-area split. The examples use `device = 'cuda:0'`. — [TxGNN README](https://github.com/mims-harvard/TxGNN)
- **Install friction reported by users.**
  - Issue #7 (1 Oct 2024): "I can't find the dgl 0.5.2 for installation". A reply points to a containerised PR #9, and the reporter says a Mac MPS backend would need a fork.
  - Issue #8: graph construction "takes a long time".
  - Issue #10: CUDA "COOToCSR does not support cuda device".
  - Issue #26 (17 Jul 2025): "Data API is not working", with a pasted 503 page. — [TxGNN issues](https://github.com/mims-harvard/TxGNN/issues)
- **Data.** `TxData` downloads `kg.csv`, `node.csv` and `edges.csv` from Dataverse file IDs 7144484, 7144482 and 7144483 (`txgnn/utils.py`).
  - These files sit in dataset **doi:10.7910/DVN/CNQV69**. This is the Therapeutics Data Commons dataset, which also holds DeepPurpose model zips. It is at version 8.0, released 15 Sep 2023. Licence: **CC0 1.0**. The TxGNN files were created 7 Jun 2023.
  - The paper's Data availability instead cites the PrimeKG dataset **doi:10.7910/DVN/IXA7BM**: version 2.1, released 2 May 2022, CC0 1.0, `kg.csv` 981,751,236 bytes. — [Dataverse API, CNQV69](https://dataverse.harvard.edu/api/datasets/:persistentId/?persistentId=doi:10.7910/DVN/CNQV69); [Dataverse API, IXA7BM](https://dataverse.harvard.edu/api/datasets/:persistentId/?persistentId=doi:10.7910/DVN/IXA7BM)
- **Pretrained weights (publicly reachable on 24 Oct 2026; not downloaded; contents unverified).**
  - The README links "an example pre-trained model weight". The link resolves to a Google Drive file named **`TxGNNExplorer_v2.zip` (1.5 G)**.
  - `reproduce/README.md` links "Model checkpoint here", which resolves to **`checkpoints_all_seeds.zip` (199 M)**. It says "You can use `TxGNN.load_pretrained` to load these checkpoints".
  - Both links return Google's "too large to scan for viruses" page, so they need no login. — [README weights link](https://drive.google.com/file/d/1fxTFkjo2jvmz9k6vesDbCeucQjGRojLj/view); [reproduce checkpoint](https://drive.google.com/file/d/1BPHKejmUpERhLTY4negB4e6ZLmoE7dwq/view)
- **Precomputed rankings.**
  - The paper's code availability says: "We developed a web-based app available at http://txgnn.org to access TxGNN's predictions and predictive rationales."
  - The Nature Medicine supplement is one PDF ("Supplementary Notes 1–4, Figs. 1–19 and Tables 1–9") plus a Reporting Summary. There is no prediction table.
  - On 24 Oct 2026, `http://txgnn.org` returned **HTTP 503** twice and `https://txgnn.org` timed out.
  - The Wayback CDX index shows HTTP 200 captures from 11 Feb 2025 to 5 Apr 2026. So the outage is recent and may be temporary. I did not check whether the archived pages contain ranking data. — [Europe PMC full text](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11645266/fullTextXML); [Wayback CDX](https://web.archive.org/cdx/search/cdx?url=txgnn.org&output=json)
- **Licences and DrugBank.**
  - Repo: MIT. Both Dataverse datasets: CC0 1.0.
  - The PrimeKG README says the MIT licence "specifically refers to the PrimeKG software, and is distinct from any licenses governing the PrimeKG dataset itself". It also says "For individual dataset usage, refer to the respective dataset licenses".
  - DrugBank's academic datasets are released under CC BY-NC 4.0. DrugBank release pages currently say "All Academic DrugBank dataset downloads are temporarily paused". — [PrimeKG README](https://github.com/mims-harvard/PrimeKG); [DrugBank release page](https://go.drugbank.com/releases/5-1-22)
- **PrimeKG status.** "PrimeKG has been superseded by OptimusKG"; "it is recommended to use OptimusKG instead of PrimeKG in almost every case". The OptimusKG Dataverse DOI is 10.7910/DVN/IYNGEV. In Jul 2023 the PrimeKG build scripts were updated to "data releases up to July 2023", but "the Harvard Dataverse files were unchanged". — [PrimeKG README](https://github.com/mims-harvard/PrimeKG)
- **Limitations stated by the authors.**
  - Capabilities "depend on the quality of medical KGs".
  - "data biases and potentially outdated information in medical KGs must be addressed".
  - The human evaluation was small (n = 12).
  - EMR enrichment may suffer from "unaccounted confounders and selection biases".
  - Predicted drugs "would need extensive screening to establish safety and efficacy". — [Nat Med full text](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11645266/fullTextXML)
- **Evaluation design (from the paper).** The paper accepts that random splits are easy, citing Duran et al.: models "make predictions for a disease by retrieving drugs from the dataset that appear similar to existing treatments". It therefore reports zero-shot (`complex_disease`) and disease-area splits. The README lists the splits as `complex_disease`, nine disease areas, `random`, `disease_eval` and `full_graph`. — [TxGNN README](https://github.com/mims-harvard/TxGNN)
- **Reproduction reports (open issues; no author reply visible today).**
  - #25 (26 May 2025): AUPRC "consistently 0.1–0.2 lower than those shown in the figures" using the provided weights.
  - #29 (2 Apr 2026): a user re-ran `reproduce/train.py` with `checkpoints_all_seeds.zip` across 5 areas × 5 seeds on an A5000 GPU. They got mean AUPRC **0.032** against **0.437** published. A commenter guesses the paper used 1:1 negative sampling (speculation).
  - #18: outputs differ from the Explorer.
  - #23: "Model evaluation inconsistency between runs".
  - #31 (9 Jul 2026): asks whether the shipped weights are the paper's weights. Unanswered. — [TxGNN issues](https://github.com/mims-harvard/TxGNN/issues)

### Inferences
- **Effort in a hackathon.** Allow 3–6 hours on a Linux machine with an NVIDIA GPU, using the containerised PR. It is high-risk on Apple Silicon: no CUDA, DGL 0.5.2 is from 2020, and Python 3.8 reached end of life in Oct 2024. CPU inference is probably possible with a CPU DGL build, but I did not verify it (unverified). On top of that come the 1–2 GB downloads (graph about 1 GB, checkpoint 1.5 GB) and the slow graph-construction step.
- **Data vintage.** The drug set predates several 2021–2023 approvals, and the graph is a 2022–2023 snapshot. For a student tool searching current diseases, TxGNN would miss new drugs and current labels. It is fine for "what a 2023 graph model would have guessed".
- **Leakage risk.** The KG mixes indication and off-label labels with mechanism edges. Shared-target paths may therefore explain most hits. The team's own KG-Bench check found that a shared-target count reaches AUC 0.85 with no model, and the same logic applies here. Compare TxGNN against that baseline before quoting it.
- **DrugBank caution (not legal advice).** The CC0 tag on Dataverse does not obviously clear upstream DrugBank terms. Treat TxGNN outputs as non-commercial research use and credit DrugBank and PrimeKG. That fits a student hackathon demo but is a reason not to redistribute the graph.

---

## 2. What current pipelines actually use to rank candidates

### Takeaway
Practice in 2024–2026 combines five families of methods:
- KG/GNN link prediction (TxGNN, Every Cure's MATRIX, AstraZeneca's ensemble "Discover Agent");
- network proximity;
- transcriptomic signature reversal (CMap/LINCS);
- genetics-led target evidence (Open Targets, Mendelian randomisation);
- since 2025, LLM agents that call these databases as tools (TxAgent, Biomni, DeepEvidence, AstraZeneca's Research Assistant).

For a no-training, evidence-grounded tool, genetics-led target evidence joined to curated drug mechanisms is the strongest choice. It is the only family with large outcome-based evidence. It is deterministic, and every hop is a citable record. Agents add retrieval and explanation, not a better ranking signal.

### Cited findings
- **Genetic support raises success.**
  - Minikel, Painter, Dong & Nelson, *Nature* 629:624–629 (online 17 Apr 2024, doi:10.1038/s41586-024-07316-0): drug mechanisms with genetic support have about **2.6×** the probability of success. The benefit varies by therapy area, rises with confidence in the causal gene, and is "largely unaffected by genetic effect size, minor allele frequency or year of discovery".
  - Ochoa et al. (*Nat Rev Drug Discov* 2022): two-thirds of drugs approved in 2021 had direct or indirect genetic support. — [Minikel et al. 2024, PMC11096124](https://pmc.ncbi.nlm.nih.gov/articles/PMC11096124/); search-result summary for Ochoa et al. (paper not opened today)
- **Open Targets Platform direction.** The NAR 2025 database update (Buniello et al., *NAR* 53(D1):D1467–D1475, published 6 Dec 2024, doi:10.1093/nar/gkae1128) added features to "prioritise targets and build therapeutic hypotheses beyond the evidence for target–disease association to progressability factors". Release 25.03 merged Open Targets Genetics into the Platform, adding credible sets, studies and variants. — [Open Targets 25.03 blog](https://blog.opentargets.org/open-targets-platform-25-03-release/); [NAR 2025, PMC11701534](https://pmc.ncbi.nlm.nih.gov/articles/PMC11701534/)
- **Transcriptomic reversal is fragile.** Lim & Pavlidis, *Sci Rep* 2021 (doi:10.1038/s41598-021-97005-z) queried CMap 2 with CMap 1 signatures. Only 17% of compounds were highly prioritised, because differential expression reproduced poorly between and within CMap versions. — [PMC8413422](https://pmc.ncbi.nlm.nih.gov/articles/PMC8413422/)
- **KG link-prediction evaluations leak.**
  - A 2025 bioRxiv benchmark (10.1101/2025.01.23.634511) reports that train–test redundancy and unrealistic test sets "artificially inflate performance". Performance drops substantially on an independent Orphanet test set.
  - "Towards a more inductive world for drug repurposing approaches" (arXiv 2311.12670, NeurIPS 2023 workshop) found that transductive models give "inflated performance" through leakage.
  - KG-Bench (bioRxiv 2025.10.13.682003; *Bioinformatics* 2026) is covered in the team's earlier notes. — [bioRxiv leakage benchmark](https://www.biorxiv.org/content/10.1101/2025.01.23.634511.full.pdf); [arXiv 2311.12670](https://arxiv.org/abs/2311.12670)
- **Every Cure MATRIX (nonprofit, KG + ML at scale).**
  - ARPA-H awarded a 3-year, $48.3M contract to score "all therapies against all diseases", with an open database promised.
  - It builds on NCATS Translator knowledge graphs. In Jan 2025 Every Cure expanded a collaboration with Google Cloud to use Gemini 2.0.
  - I found no independent accuracy evaluation. — [Every Cure 2025 annual report](https://everycure.org/wp-content/uploads/2026/01/EVery.Cure_.2025.Annual.Report.Single.Digital.Pages.pdf); [Inside Precision Medicine](https://insideprecisionmedicine.com/topics/precision-medicine/every-cure-nets-48m-award-to-repurpose-approved-drugs-for-rare-diseases)
- **LLM agents with tools.**
  - **TxAgent** (Gao … Zitnik, arXiv 2503.10970, v1 14 Mar 2025, no journal ref): ToolUniverse has "211 tools", including "all US FDA-approved drugs since 1939" and Open Targets. The authors claim 92.1% on open-ended drug reasoning benchmarks they built themselves (3,168 tasks), using real-time retrieval and "cross-source validation". — [arXiv](https://arxiv.org/abs/2503.10970)
  - **Biomni** (Huang … Leskovec, bioRxiv 10.1101/2025.05.30.656746, 30 May 2025): a general biomedical agent with retrieval-augmented planning and code execution. Drug repurposing is one of its benchmarked tasks. — [bioRxiv](https://biorxiv.org/content/10.1101/2025.05.30.656746v1)
  - **DeepEvidence** (Wang … Sun, arXiv 2601.11560, submitted 23 Dec 2025): orchestrator agents explore Open Targets, ChEMBL and other KGs and build an evidence graph in which "every node and relation is grounded with explicit provenance". — team notes `arxiv_2601_11560.md`
  - **AstraZeneca Research Assistant** (arXiv 2608.12395, 6 Aug 2026): this production system reached 15,000 users. Its graph-ML "Discover Agent" ensembles GCN/GAT, RotatE, ComplEx, DWPC and similarity models and combines their rankings with CRank. Answers are grounded through evidence objects that carry IDs. — team notes `arxiv_2608_12395.md`
- **No head-to-head ranking of methods.** A 2024 *Briefings in Bioinformatics* review of KGs for repurposing frames the task as link prediction and stresses explainability. I found no 2024–2026 review that benchmarks the families above head-to-head. — [PMC11426166](https://pmc.ncbi.nlm.nih.gov/articles/PMC11426166/)
- **Network proximity and Mendelian randomisation (unverified today).** Network proximity (Cheng et al., *Nat Commun* 2018, and successors) and drug-target MR are widely used. I did not open a 2024–2026 primary source for either in this session.

### Inferences
- **Signal ranking for this app.** Genetics-weighted target evidence plus curated mechanism and potency is (a) outcome-validated, (b) deterministic and (c) fully citable. KG/GNN, proximity and CMap are hypothesis generators: useful for "unexpected" candidates, but each needs its own leakage-safe validation. A 24-hour build cannot provide that.
- **Agents do not replace ranking.** TxAgent, Biomni, DeepEvidence and Research Assistant all retrieve from the same databases the team already queries. Their value is in orchestration and explanation, which the jury already covers.

---

## 3. How evidence-grounded LLM systems control hallucination (2025–2026)

### Takeaway
The working pattern is:
1. Retrieve records.
2. Give each one an ID.
3. Let the LLM write only claims tied to those IDs, in a structured output.
4. Verify afterwards.

Papers show that **citation existence is not citation support**, and that support is not faithfulness. Multi-LLM juries are a recognised practice for *evaluation* (PoLL, 2024), but 2025–2026 work shows that LLM judges make correlated errors. Panel agreement is therefore weak evidence of truth.

### Cited findings
- **ID-grounded retrieval in production.** AstraZeneca's Research Assistant follows three steps: "find the most appropriate data sources and facts", "Ground the answer in retrieved evidence", "Link users to the original sources". Every agent returns an `Observation` with an ID, "a tag used later to inject into the LLM response for grounding each statement". "Keeping the LLM instructions lean while guiding the system to rely only on the obtained external information was intended to reduce hallucinations." The paper publishes no hallucination or citation-precision rates. — team notes `arxiv_2608_12395.md`, from [arXiv 2608.12395](https://arxiv.org/html/2608.12395v1)
- **Cited sources often do not support the claim.** SourceCheckup (Wu et al., *Nat Commun* 16:3615, 16 Apr 2025, doi:10.1038/s41467-025-58551-6) tested 7 LLMs on 800 questions and 58,000 statement–source pairs. **50–90% of responses are not fully supported** by their cited sources. GPT-4o with web search left about 30% of statements unsupported. — [PMC12003634](https://pmc.ncbi.nlm.nih.gov/articles/PMC12003634/)
- **Supporting citations can still be post-hoc.** Wallat, Heuss, de Rijke & Anand (arXiv 2412.18004, Dec 2024) found "up to 57% of citations lack faithfulness": the model answered from prior knowledge and then attached a source that fits. — [arXiv 2412.18004](https://arxiv.org/abs/2412.18004)
- **Juries as a practice.** "Replacing Judges with Juries" (Verga et al., Cohere, arXiv 2404.18796, Apr 2024) proposes a Panel of LLM evaluators (PoLL) built from smaller, diverse model families. It reports better agreement with human judgement, less intra-model (self-preference) bias and about 7× lower cost than a single GPT-4 judge. It was tested on only three judge settings, with no reasoning or maths tasks and no biomedical tasks. — [arXiv 2404.18796](https://arxiv.org/abs/2404.18796)
- **Correlated errors.**
  - Kim, Garg, Peng & Garg, "Correlated Errors in Large Language Models" (ICML 2025, arXiv 2506.07962) studied more than 350 LLMs. On one leaderboard, models **agree 60% of the time when both are wrong**. Errors correlate more within the same developer or base architecture, and more for the most accurate models. — [arXiv 2506.07962](https://arxiv.org/abs/2506.07962)
  - Kohli, "Nine Judges, Two Effective Votes" (arXiv 2605.29800, v1 28 May 2026) used 9 frontier LLMs from 7 families. They provide "only about 2 independent votes' worth of information", and "roughly three-quarters of the panel's nominal independence is lost". Panel accuracy falls 8–22 points short of independent voting, and aggregation methods close at most 11% of the gap. — [arXiv 2605.29800](https://arxiv.org/abs/2605.29800)
- **Agent-side grounding.** TxAgent claims real-time retrieval, "cross-source validation" and transparent reasoning traces, but the abstract does not describe how these are implemented. DeepEvidence keeps a provenance-tagged evidence graph. — [arXiv 2503.10970](https://arxiv.org/abs/2503.10970); team notes `arxiv_2601_11560.md`

### Inferences
- **What the team's ID check proves.** Rejecting invented IDs is necessary and matches practice, but it only proves the ID exists. SourceCheckup and Wallat et al. show the gap between existence, support and faithfulness.
- **Cheapest support check.** Force each juror claim into a schema: `claim_type` (for example `target_association`, `mechanism`, `potency`, `approval_status`), plus the `drug`, `target` and `disease` IDs and `evidence_ids`. Then check in code that the cited record actually links those IDs and that any number quoted matches the record. Anything unverifiable is shown as "commentary", not as a fact.
- **Jury framing.** Show per-juror ranks and disagreement. Never say "4/4 models agree" as if it were confidence: with correlated errors, 4 LLMs are probably worth 1–2 votes. Disagreement is the informative part, because it tells students where to look.

---

## 4. Bottom line for the plan

### Takeaway
Keep the evidence-first design. It is a reasonable, simplest-that-works approach and lines up with both the outcome evidence (genetic support) and production practice (ID-grounded retrieval with the LLM restricted to explanation). Reject the RGCN-as-main-ranker proposal. Treat TxGNN as an optional stretch goal, not a cheap column. Spend the saved time on small, verifiable additions.

### Recommended low-cost changes (in priority order)
1. **Keep the deterministic score as the final rank.** The jury writes commentary and flags disagreement, but never re-ranks. (Matches the team's learning `l-e7a349d8`.)
2. **Add a genetic-support badge per target.** Show the badge when the association has genetic datasources (GWAS credible sets/L2G, gene burden, Mendelian sources such as Orphanet, Gene2Phenotype, ClinGen) above a threshold. Cite Minikel et al. 2024 in the UI tooltip. This is a filter on data already fetched.
3. **Add claim-level checks beyond ID existence.** Use structured juror outputs and check in code that the cited record contains the drug, target and disease IDs and numbers the claim states. Report "supported-claim rate" next to "citation-validity rate".
4. **Show the jury as a disagreement map.** Display per-juror rank, a spread statistic and a short caveat citing Kim et al. 2025 and Kohli 2026. Optionally keep jurors from different model families, since same-family models correlate more.
5. **Keep the known-answer hygiene.** Drop `clinical_precedence` and drug-naming biomarker rows (learning `l-8f3f1384`), and label drugs already approved or in trials for the disease separately from "new" candidates.
6. **Use a baseline for any ML column.** If a graph-model column ever appears, show it next to the shared-target-count baseline and label it "graph-model guess (2023 KG), not evidence".
7. **TxGNN column: only if cheap on the day.**
   - The Explorer is down, there is no prediction table, the stack is old and the reproduction gap is disputed.
   - If someone has a Linux GPU box, time-box 2–3 hours to score only the demo diseases with `split='full_graph'` (per issue #18) and the 1.5 GB checkpoint.
   - Otherwise drop it and say why in the README. Note that this is the team's own decision to run third-party code, which I did not test.
8. **Optional safety context.** Drug warnings and withdrawals from ChEMBL/Open Targets are cheap to fetch and useful for students. I did not check the field names against API 26.9 (unverified).

### Open items / not verified today
- Whether archived txgnn.org pages contain machine-readable rankings, and when or whether the Explorer comes back.
- The contents of `TxGNNExplorer_v2.zip` (1.5 GB), not downloaded. It may hold more than weights.
- CPU-only TxGNN inference time.
- 2024–2026 primary sources for network proximity and drug-target MR.
- The full text of Ochoa et al. 2022.
- Whether Snowflake Cortex supports schema-enforced structured outputs for all 4 juror models.
