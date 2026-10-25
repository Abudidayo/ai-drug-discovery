# LLM reranking, LLM-as-judge and multi-model aggregation for drug repurposing candidate ranking (2022-2026)

Context for the report writer: our jury reranks 15-candidate drug panels from cited evidence packets, with drug names hidden. Single models (GPT-5.4, Claude Opus) reached MRR about 0.42-0.46 against 0.22 chance. A 3-model Borda jury did not beat chance, partly because one model refused. Adding pathway evidence did not help. With names shown, models do much better because they recognise the drugs.

## 1. How LLMs have been evaluated on drug repurposing, indication prediction and target prioritisation, and how they controlled for memorisation

### Takeaway
I found no published benchmark that ranks drug candidates with drug names hidden, as our jury does. The published work is mostly small (around 10 hypotheses), uses retrieval or knowledge-graph paths, or controls leakage with date-based splits rather than name masking. Date-based splitting is the standard leakage control in biomedical hypothesis work. A study outside biomedicine shows that entity masking can expose memorisation that overall accuracy hides.

### Cited Findings
- **Vanderbilt Alzheimer's study (npj Digital Medicine, 2024).** ChatGPT proposed and ranked 20 repurposing candidates for Alzheimer's disease. Each prompt was repeated 10 times. The top 10 were then tested against incident Alzheimer's risk in Vanderbilt medical records and the All of Us cohort. Metformin, simvastatin and losartan were linked to lower risk in a meta-analysis. Drug names were visible, so this tests ranking of known drugs, not blind reasoning. — [Yan et al., PMC10897392](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10897392/)
- **Hypothesis validation (bioRxiv, June 2025).** GPT-4o, Claude-3, Gemini-2 and DeepSeek were tested on validating repurposing hypotheses with 10 prompt strategies. Structured prompts improved accuracy, and GPT-4o and DeepSeek were the most reliable. The benchmark was very small: 7 viable and 3 non-viable cases. — [bioRxiv 2025.06.13.659527](https://www.biorxiv.org/content/10.1101/2025.06.13.659527v1)
- **K-Paths (KDD 2025).** The method retrieves diverse multi-hop knowledge-graph paths (built on Hetionet plus observed interactions) and gives them to the LLM as text. This raised zero-shot drug-repurposing F1 by 12.45 points for Llama 3.1 8B and by about 6.2 points for Llama 70B. Tx-Gemma 27B gained 4.0 F1 points on repurposing. The v1 and v2 abstracts disagree on the 70B figures. Path evidence helped here, unlike our pathway result, but the comparison baseline was a model with no structured evidence at all. — [K-Paths, arXiv 2502.13344](https://arxiv.org/pdf/2502.13344)
- **LLaDR (EMNLP Findings 2025).** LLM-assisted concept representations for drug repurposing, evaluated on a strict date-based split: training on data up to 2022, testing on 2023-2025, with hard negatives taken from failed assays and trials. Its masking experiment hid parts of the LLM-generated descriptions, not drug names. — [arXiv 2510.12181](https://arxiv.org/html/2510.12181v1)
- **SerenQA (AAAI-26).** An expert-annotated drug-repurposing question-answering benchmark built on the Clinical Knowledge Graph. Leading LLMs retrieved knowledge well but struggled to find "genuinely surprising and valuable discoveries". The abstract mentions no leakage controls. — [arXiv 2511.12472](https://arxiv.org/abs/2511.12472)
- **Target prioritisation for Alzheimer's (medRxiv, late 2025).** Gemini 2.5 Pro with web search ranked 522 Alzheimer's targets. Retrieval-augmented reasoning beat LLM-only prompting on early enrichment of targets now in clinical trials and came close to the Open Targets association benchmark. — [medRxiv 2025.12.28.25343106](https://www.medrxiv.org/content/10.64898/2025.12.28.25343106v1.full)
- **TargetPro (Scientific Reports, 2026).** General LLMs such as o3 and GPT-5 started above 70% precision but lost more than 25 points as the number of requested targets grew. Open Targets started below 50%. This result comes from a search-result summary; I did not read the full text. — [Sci Rep s41598-026-47765-3](https://www.nature.com/articles/s41598-026-47765-3)
- **Date-based splits in biomedical hypothesis generation.** Qi et al. (COLM 2024) divided background-hypothesis pairs into training, seen and unseen test sets by publication date to limit contamination, and reported that LLMs produced validated hypotheses even on unseen literature. — [arXiv 2407.08940](https://arxiv.org/html/2407.08940v2). A related paper used a January 2023 cutoff with August 2023 test literature. It found that adding few-shot examples or tools could *reduce* hypothesis-generation proficiency. — [arXiv 2311.05965](https://arxiv.org/pdf/2311.05965)
- **BioDisco.** This system restricts PubMed retrieval to articles published after the cutoff and uses a model with a known training cutoff (GPT-3.5 Turbo, September 2021) to prevent leakage. — [arXiv 2508.01285](https://arxiv.org/pdf/2508.01285)
- **Entity masking as a leakage probe (misinformation detection, 2026).** Masking named entities cut supported-claim recall from 0.42 to 0.13, while overall accuracy moved only 0.03. The authors argue that aggregate accuracy can hide memorised outcomes. — [arXiv 2610.04888](https://arxiv.org/html/2610.04888)
- **Leakage in repurposing models.** A review notes that network-based repurposing methods are prone to data leakage and over-optimistic retrospective evaluation. KG-Bench says GNN repurposing performance is often overestimated because of leakage and missing external validation sets, and proposes time-stamped splits. — [PMC13297213](https://pmc.ncbi.nlm.nih.gov/articles/PMC13297213/); [KG-Bench bioRxiv](https://www.biorxiv.org/content/10.1101/2025.10.13.682003.full.pdf)

### Inferences
- Our blind design (names masked) is stricter than most published LLM repurposing evaluations, so our MRR of about 0.42-0.46 is not directly comparable to published numbers obtained with names visible.
- Our names-shown result matches the misinformation masking study: performance with identities visible mostly reflects recognition. Reporting the gap between masked and unmasked runs is a useful leakage metric in its own right.
- Masking names may not be enough. Distinctive evidence (a unique target, a ChEMBL assay, a mechanism string) can still identify a well-known drug. A date-based split (indications approved after the model's training cutoff) would complement masking. Inference only; I found no study that tests this for drugs.

### Gaps
- I found no published benchmark that masks drug identities in LLM repurposing ranking and reports MRR or Hits@k against a chance baseline.
- No peer-reviewed head-to-head comparison of frontier LLMs with TxGNN on drug-disease ranking was found. DrugKLM (arXiv 2604.19815) claims to beat TxGNN, but I could not confirm which LLM baselines or metrics it used.
- Full TargetPro numbers and methods were not verified.

## 2. Listwise, pairwise, pointwise and setwise reranking: which is better for a 15-item list?

### Takeaway
On standard passage-reranking benchmarks, pairwise prompting that queries each pair in both orders is the most robust to input order. Listwise ranking with GPT-4 is about as accurate, but its results depend heavily on how the list is ordered on input. With 15 items, a single listwise call fits easily. Repeating it over several shuffled orders and combining the results (permutation self-consistency) is the cheapest well-supported fix. Full pairwise comparison costs 210 calls per panel, which is affordable only for a few panels.

### Cited Findings
- **RankGPT vs PRP on TREC Deep Learning.** NDCG@10 on the TREC Deep Learning 2019 and 2020 sets (DL19/DL20):
  - RankGPT gpt-4: 75.59 (DL19), 70.56 (DL20).
  - RankGPT gpt-3.5-turbo: 65.80 (DL19), 62.91 (DL20).
  - PRP-Allpair (Flan-UL2 20B): 72.42 (DL19), 70.68 (DL20).
  - PRP-Sliding-10: 72.65 (DL19), 70.46 (DL20).
  - On BEIR, PRP-Sliding-10 averaged 53.55 against 51.33 for gpt-3.5. — [Qin et al., PRP, NAACL 2024, arXiv 2306.17563](https://arxiv.org/html/2306.17563v2)
- **Sensitivity to input order.** With the initial BM25 order reversed, RankGPT gpt-3.5 fell from 65.80 to 32.77 NDCG@10 on DL19. PRP-Allpair stayed almost unchanged (72.42 to 72.40), and PRP-Sliding-10 fell to 64.84. — [arXiv 2306.17563](https://arxiv.org/html/2306.17563v2)
- **Cost.** PRP-Allpair needs O(N²) calls, PRP-Sorting O(N log N) and PRP-Sliding-K O(N) per pass. PRP removes position bias by asking each pair in both orders and counting a disagreement as a tie. The authors note this swap trick is hard to apply to listwise methods. — [arXiv 2306.17563](https://arxiv.org/html/2306.17563v2)
- **Listwise failure modes.** The PRP paper lists four: missing items, *rejection* (the model refuses or returns irrelevant output), repetition, and inconsistency across input orders. When listwise output is malformed, methods fall back to the initial order. — [arXiv 2306.17563](https://arxiv.org/html/2306.17563v2)
- **Setwise prompting (SIGIR 2024).** Under one comparison framework, pointwise methods were efficient but ranked poorly, and pairwise methods ranked well but were expensive. Setwise (pick the best item from a small set) cut inference calls and prompt tokens while staying effective. A reproducibility study confirmed the trade-offs; its Setwise Insertion variant cut query time by 31% and inferences by 23%. — [Zhuang et al., arXiv 2310.09497](https://arxiv.org/abs/2310.09497); [reproducibility study](https://www.dare.uva.nl/id/9c56c9f4-5980-4e05-8aac-d93fdbb3f053?page=592)
- **Pairwise judges are swayed by distractors.** Adding assertiveness, verbosity or sycophancy to the weaker response flipped pairwise LLM-judge preferences about 35% of the time, against about 9% for absolute (pointwise) scores. The authors favour absolute scoring for correctness-type tasks. — [Tripathi et al., COLM 2025, arXiv 2504.14716](https://arxiv.org/pdf/2504.14716)
- **Pairwise preferences are often inconsistent.** LLM-RankFusion documents two failure types: preferences that reverse when the pair is swapped, and cycles such as A>B, B>C, C>A. It addresses them with in-context examples, calibrated preference probabilities and Borda aggregation across rankers. I did not get numeric gains. — [arXiv 2406.00231](https://arxiv.org/abs/2406.00231)

### Inferences
- **Call budget for our 15-item panels (arithmetic, not sourced):**
  - Full pairwise in both orders: 15×14/2 = 105 pairs × 2 = 210 calls per panel per model.
  - Pairwise via sorting: about N log₂N ≈ 59 comparisons, or about 118 with both orders.
  - Listwise with permutation self-consistency at m = 5-10 shuffles: 5-10 calls per panel.
  - With a budget of tens to low hundreds of calls, listwise plus shuffling is the only option that covers many panels. Full pairwise fits only one or two panels, so treat it as a diagnostic.
- No source tests pairwise vs listwise on 15-item biomedical evidence packets. Passage-ranking results may not carry over to long, structured evidence packets, where each pairwise prompt would hold two full packets.
- Pointwise scoring of each candidate on a fixed rubric against its evidence costs 15 calls per panel. It ranks less well on passage benchmarks, but it resists distractors better (9% vs 35% flips). It also yields scores that can be calibrated and averaged across models, unlike Borda ranks. This is worth an ablation; it is not an established win.

### Gaps
- No direct evidence on how listwise and pairwise compare for lists as short as 15 in a scientific-reasoning setting.
- I found no study of tournament or Swiss-style designs for LLM ranking with numbers on short lists.

## 3. Combining multiple LLMs or samples: self-consistency, debate, mixture-of-agents, Borda vs score averaging vs reliability weighting, and when ensembles fail

### Takeaway
There is strong, repeated evidence that mixing models of uneven quality can make a group *worse* than its best member. Errors that move together set a floor that more members cannot remove. Debate adds little beyond simple voting. Sampling one strong model several times (Self-MoA, permutation self-consistency) often beats mixing different models. Our failed Borda jury fits this pattern well.

### Cited Findings
- **Self-MoA (TMLR 2026).** Combining outputs sampled only from the single best model beat standard mixed-model MoA by 6.6% on AlpacaEval 2.0 and by an average of 3.8% across MMLU, CRUX and MATH. MoA was "rather sensitive to quality", and mixing different LLMs "often lowers the average quality". The authors describe a trade-off between diversity and quality. — [Li et al., arXiv 2502.00674](https://arxiv.org/pdf/2502.00674)
- **Debate or Vote (NeurIPS 2025).** Across 7 benchmarks, majority voting explained most of the gain credited to multi-agent debate. For Qwen2.5-7B, voting scored about 0.769 accuracy against about 0.667 for centralized debate. The authors model debate as a martingale: on its own it does not raise expected correctness. — [Choi et al., arXiv 2508.17536](https://arxiv.org/pdf/2508.17536)
- **More calls can hurt.** Voting systems' performance first rises, then falls, as calls increase, because extra calls help on easy queries and hurt on hard ones. The paper fits a scaling law to choose the call count from a small sample. — [Chen et al., arXiv 2403.02419](https://arxiv.org/html/2403.02419v2)
- **Correlated errors (preprint).** An information-theoretic analysis of ensemble selection says adding models naively does not guarantee gains. Correlated errors leave an error floor that more members cannot remove, so choose a subset that lowers effective correlation instead of simply taking the highest-scoring models. — [arXiv 2602.08003](https://arxiv.org/html/2602.08003)
- **Negative ensembling (preprint).** On TriviaQA, plain test-time ensembles got worse as more models were added. — [arXiv 2510.13855](https://arxiv.org/html/2510.13855v2)
- **Anchor corruption (preprint).** Another preprint derives a condition, based on member accuracies, under which a group of weaker models falls below a strong anchor. It calls this "anchor corruption". — [arXiv 2606.00405](https://arxiv.org/pdf/2606.00405)
- **Replacing Judges with Juries (PoLL, Cohere 2024).** A panel of smaller models from different families beat a single GPT-4 judge across 3 judge settings and 6 datasets. The panel showed less self-preference bias and cost about 7× less. This is a positive jury result, but for grading answers, not for ranking where one model might refuse. — [Verga et al., arXiv 2404.18796](https://arxiv.org/abs/2404.18796v2)
- **Wisdom of the Silicon Crowd (Science Advances, 2024).** The combined forecasts of 12 LLMs on 31 binary questions did not differ significantly from 925 human forecasters (pre-registered analysis). Individual LLMs showed an acquiescence bias. — [Schoenegger et al., PMC11800985](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11800985/)
- **Aggregation rule.** In permutation self-consistency, Kemeny-Young aggregation (minimising Kendall-tau distance) beat Reciprocal Rank Fusion (RRF) in 8 of 10 comparisons (p<0.05), by 0.23 points on average; RRF reached about 93.5% of Kemeny's gain. Kemeny beat Borda by about 0.39 (GPT-3.5) and 0.42 (GPT-4) points. The choice of rule is a second-order effect. — [Tang et al., arXiv 2310.07712](https://arxiv.org/html/2310.07712)
- **RRF vs weighted sums.** In BioASQ reranker fusion, RRF consistently beat a weighted score sum because it uses ranks and avoids mismatched score scales. — [BIT.UA BioASQ 14B, arXiv 2609.04999](https://arxiv.org/pdf/2609.04999)

### Inferences
- Our jury probably failed for the reasons these papers describe: a weak or refusing member is added with equal weight, and Borda gives that member's noisy or default ranking the same vote as the strong models. The likely fixes, in order:
  1. Replace the mixed jury with Self-MoA / permutation self-consistency on the best single model.
  2. If several models are kept, weight or select them by reliability measured on held-out pilot panels.
  3. Treat refusals as missing votes, not as rankings.
- Debate rounds are unlikely to pay for their calls (Choi et al.).
- Weighting by reliability needs a held-out calibration set. With few panels, estimated weights will be noisy, so a simple keep-or-drop subset choice is safer than continuous weights. This is inference; I found no source that tests it at our scale.
- Because of the non-monotonic voting result, more samples is not always better. Hard panels may get worse with more votes.

### Gaps
- I found no study that combines several LLMs' rankings on a biomedical candidate-ranking task.
- Full PoLL numbers were not retrieved.
- Several of the ensemble-failure papers (2602.08003, 2510.13855, 2606.00405) are recent preprints that have not been peer reviewed.

## 4. Calibration and position/order bias in LLM ranking, and mitigations

### Takeaway
Position bias is well documented and large enough to reverse outcomes. Reordering candidates alone let Vicuna-13B beat ChatGPT on 66 of 80 queries. The best-supported fixes are to shuffle the input, run several orders and combine the results (permutation self-consistency), or to ask each pair in both orders. For 15-item lists, 5-10 shuffles capture most of the gain.

### Cited Findings
- **Order can be gamed.** Candidate quality rankings "can be easily hacked by simply altering their order". With ChatGPT as the judge, Vicuna-13B beat ChatGPT on 66 of 80 queries after reordering. Two fixes were proposed: Multiple Evidence Calibration (explain before scoring, then sample k scores) and Balanced Position Calibration (combine scores across both orders). — [Wang et al., ACL 2024, arXiv 2305.17926](https://arxiv.org/pdf/2305.17926)
- **Permutation self-consistency, setup and cost.** 20 shuffled orders per example at temperature 0, combined with Kemeny aggregation. Five shuffles captured about 67% of the 20-shuffle gain, and returns "sharply diminish after 5-10". — [Tang et al., arXiv 2310.07712](https://arxiv.org/html/2310.07712)
- **Gains on sorting tasks.** On 10-item sorting tasks, Kendall tau improved for GPT-4 on MathSort (83.5 to 89.6) and GSM8KSort (88.4 to 90.5), and for GPT-3.5 on MathSort (64.0 to 75.2). Gains were larger for weaker models and harder tasks (correlation with original quality r = -0.72). Permutation self-consistency beat the best of 20 single runs on every task and model. — [arXiv 2310.07712](https://arxiv.org/html/2310.07712)
- **Gains on passage reranking.** Single-call GPT-4 on BM25 top-20 improved from 60.88 to 64.88 NDCG@10 (DL19) and from 57.78 to 62.49 (DL20). — [arXiv 2310.07712](https://arxiv.org/html/2310.07712)
- **Where the bias falls depends on the model.** GPT-3.5 reversed pairs in the middle of the list more often ("lost in the middle") and handled items past about position 15 poorly. GPT-4 reversed pairs near the end more often. — [arXiv 2310.07712](https://arxiv.org/html/2310.07712)
- **Temperature.** Varying it from 0 to 0.75 had little effect on quality, so the gain comes from reordering, not from sampling noise. — [arXiv 2310.07712](https://arxiv.org/html/2310.07712)
- **Pairwise swaps.** PRP asks each pair in both orders and treats disagreement as a tie. — [arXiv 2306.17563](https://arxiv.org/html/2306.17563v2)
- **Acquiescence bias.** LLM forecasters' mean prediction sat well above 50% even though outcomes were about evenly split. This is a calibration bias that averaging across models does not remove. — [Schoenegger et al.](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11800985/)

### Inferences
- Our 15-item panels sit right at the length where GPT-3.5-class models began to degrade, so frontier models are probably fine on length. Shuffling still matters, because each model places its bias differently.
- **Cheapest well-supported upgrade (arithmetic):** for each panel and model, run 5 random orders of the anonymised candidates and combine them with Kemeny (exact Kemeny on 15 items is feasible with a small integer program) or with Borda. That is 5× the current calls; with our call budget it suits roughly 10-40 panels for one model.
- It also lets us measure each model's order sensitivity (spread across shuffles), which could serve as a reliability weight for the jury.

### Gaps
- I found no study of position bias in LLM ranking of long, structured scientific evidence packets.
- No evidence on whether verbalised confidence from frontier models is calibrated for biomedical candidate ranking.

## 5. Retrieval-augmented approaches (literature, PubMed) for biomedical hypothesis evaluation, and the risk that retrieved text gives away the answer

### Takeaway
Retrieval often helps biomedical LLM tasks, but irrelevant or contradicting evidence hurts. Some hypothesis-generation work found that adding tools or examples *reduced* performance, which fits our pathway result. The main leakage risk is that retrieved abstracts name the drug or report the very indication being tested. Published defences are date filters and models with a known cutoff. I found no study that measures this leakage directly for repurposing.

### Cited Findings
- **Biomedical RAG benchmark.** Three LLMs with three retrievers were tested across five tasks and nine datasets. Retrieval helped most datasets, but models struggled with unlabeled and counterfactual retrieved information. — [arXiv 2405.08151](https://arxiv.org/pdf/2405.08151)
- **HealthContradict (BioNLP 2026).** Correct retrieved evidence improved accuracy and calibration; incorrect evidence degraded both. — [ACL Anthology listing](https://aclanthology.org/people/yikun-han/unverified/)
- **Extra context can reduce proficiency.** Adding few-shot examples or tools could reduce LLM hypothesis-generation proficiency. — [arXiv 2311.05965](https://arxiv.org/pdf/2311.05965)
- **Graph paths can help.** K-Paths' diverse knowledge-graph paths raised zero-shot repurposing F1 by 4-12 points. It used diversity-aware path retrieval (Yen's K-shortest loopless paths), not raw dumps of every path. — [arXiv 2502.13344](https://arxiv.org/pdf/2502.13344)
- **Retrieval with web search.** In Alzheimer's target ranking, retrieval with web search beat LLM-only prompting on early enrichment of clinically validated targets. — [medRxiv 2025.12.28.25343106](https://www.medrxiv.org/content/10.64898/2025.12.28.25343106v1.full)
- **Date-filtered retrieval.** BioDisco restricts PubMed to articles after the cutoff and uses a model with a known training cutoff to avoid leakage. — [arXiv 2508.01285](https://arxiv.org/pdf/2508.01285)
- **Overlap audits.** A biomedical claim-verification study removed rows where evidence overlapped between sets and reported the result as a sensitivity check. — [arXiv 2608.01409](https://arxiv.org/pdf/2608.01409)

### Inferences
- Our null result for pathway evidence fits the "distraction" findings. Reactome pathway lists are probably low-specificity, since many candidates share broad pathways, so they add tokens without separating candidates. K-Paths suggests that a few disease-specific paths chosen for diversity are more useful than broad pathway membership. This is inference.
- **If PubMed abstracts are added:**
  - Redact drug names, brand names, synonyms and ChEMBL IDs from the abstracts.
  - Drop abstracts that report the target indication outright (for example, a trial of drug X in disease Y).
  - Date-filter to before each indication's approval or first trial.
  Without these steps, retrieval reintroduces the name leakage the blind design removes. Inference; no source tested it for repurposing.
- **Leakage check:** compare blinded-with-retrieval scores against unblinded scores. If retrieval closes most of that gap, it is probably leaking.

### Gaps
- I found no study that measures how often retrieved biomedical literature reveals the held-out answer in repurposing or indication-prediction evaluations.

## 6. Safety refusals by frontier models on biomedical prompts, and how evaluations handle them

### Takeaway
Refusal rates on biological research prompts vary enormously between frontier models, from about 0% to 95% on the same prompts. One 2026 preprint links the Anthropic API stack to higher refusal odds. Listwise rankers are known to fail by "rejection". Most published ranking papers fall back to the initial order or drop the failed case; I found no shared standard. Refusals should be logged and reported separately, and should not count as votes.

### Cited Findings
- **RefusalBench (preprint, May 2026).** 141 prompts in 47 matched sets that vary only biological risk tier (benign, borderline, dual-use), run against 19 frontier models over 13,389 judged trials. Strict refusal rates ranged from 0.1% to 94.6% on identical prompts. Raw refusal rate misranks safety: Grok 4.20 had the best tier discrimination (Youden's J = 0.787) but ranked 7th by refusal rate. The repo reports that Claude Opus 4.8 cut benign over-refusal from 77% to 57% compared with Opus 4.7, and that the Anthropic API stack was linked to higher refusal odds. This is a single-team preprint judged by an AI council and not peer reviewed. — [arXiv 2605.21545](https://arxiv.org/abs/2605.21545); [GitHub refusalbench](https://github.com/AppliedScientific/refusalbench)
- **OR-Bench (ICML 2025).** 80,000 prompts that tend to trigger over-refusal, across 10 rejection categories. General-purpose, not biomedical. — [arXiv 2405.20947](https://arxiv.org/abs/2405.20947)
- **Refusal as a ranking failure.** The PRP paper lists "rejection" (the model refuses and returns irrelevant output) as a listwise failure mode; such failures fall back to the initial order. — [arXiv 2306.17563](https://arxiv.org/html/2306.17563v2)
- **USMLE benchmarking.** One model declined two image-based questions because of a moderation warning. The authors noted the safety value of such filters and the barrier they create in clinical settings. — [PMC12796295](https://pmc.ncbi.nlm.nih.gov/articles/PMC12796295/)

### Inferences
- **Handling refusals:**
  - Report refusal rate per model.
  - Report two scores: one counting each refusal as a chance-level ranking (intent-to-treat), and one over answered panels only.
  - In the jury, drop the refusing member's vote for that panel and renormalise. Do not let a fallback order enter Borda.
  - This follows the logic of the PRP fallback finding and the RefusalBench variance; it is not a published standard.
- Matched-prompt designs suggest framing that may reduce benign over-refusal: present the task as ranking already-approved compounds from public databases, and avoid synthesis or dosing language. Re-test refusal rates on pilot panels before pre-registering. Speculative; untested on our prompts.

### Gaps
- I found no peer-reviewed study of frontier-model refusal rates on routine drug-repurposing or pharmacology ranking prompts.
- No agreed convention for scoring refusals in LLM ranking benchmarks was found.
