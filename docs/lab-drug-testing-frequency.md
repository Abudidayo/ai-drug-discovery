# How often do real labs test possible drugs?

Research note for the drug-repurposing explorer. Question from a student: "In real labs, how often do people test possible drugs as a solution?" Researched 24 October 2026 against primary sources. Every figure carries its dataset and year, because these numbers shift a lot depending on who counted, what they counted and when.

## Short answer

- **Early lab screening happens all the time and at huge scale.** In a single pharmaceutical drug-discovery project, a robot-driven high-throughput screen (HTS) typically tests 200,000 to more than 1,000,000 compounds against one target over a few weeks ([Hughes et al. 2011](https://doi.org/10.1111/j.1476-5381.2010.01127.x)). Screening at about 100,000 assays per day has been called "ultra-high-throughput" since at least 1999 ([IUPAC, Maclean et al. 1999](https://doi.org/10.1351/pac199971122349)). Public centres such as NIH NCATS keep libraries of more than 100,000 compounds ready to screen ([NCATS Compound Management](https://ncats.nih.gov/research/research-activities/compound-management)).
- **Almost everything that gets tested fails.** Typically fewer than 1% of screened compounds are "hits" in the first assay ([Hughes et al. 2011](https://doi.org/10.1111/j.1476-5381.2010.01127.x)). Only about 10% of industry small-molecule projects produce a candidate good enough to test in people (same source). Of drugs that do enter human trials, roughly 8% to 14% are eventually approved ([BIO/Informa/QLS 2021](https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf); [Wong, Siah & Lo 2019](https://doi.org/10.1093/biostatistics/kxx069)).
- **Human testing is rare, slow and expensive.** On average a drug takes 10.5 years to get from Phase I to approval ([BIO 2021](https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf)). Estimates of cost per approved drug run from about $1.0 billion to $2.6 billion or more, depending on method ([Wouters et al. 2020](https://doi.org/10.1001/jama.2020.1166); [DiMasi et al. 2016](https://doi.org/10.1016/j.jhealeco.2016.01.012)). The FDA approved 50 novel drugs in 2024 ([FDA CDER](https://www.fda.gov/drugs/novel-drug-approvals-fda/novel-drug-approvals-2024)).
- **Repurposing (our app's niche) is common, and it does better in the clinic, but most computer predictions are never tested in a lab.** About a third of FDA-approved new drugs later gained approval for a different therapeutic use ([Akodad et al. 2026](https://doi.org/10.1038/s43856-025-01344-1)). Off-patent and non-novel products have about twice the Phase I-to-approval success of novel drugs ([BIO 2021](https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf)). However, a review of COVID-19 computational repurposing found that most studies never followed up their predictions with experiments ([Galindez et al. 2021](https://doi.org/10.1038/s43588-020-00007-6)). When 918 computer-ranked drugs were tested in cells, about 8% showed any antiviral effect ([Gysi et al. 2021](https://doi.org/10.1073/pnas.2025581118)).
- **The famous "5,000-10,000 compounds -> 250 -> 5 -> 1" funnel is a PhRMA graphic.** It was attributed to unpublished 1995 Tufts data, and its early-stage numbers have no traceable published dataset (see [section 1](#1-the-overall-funnel-and-where-5000-10000---250---5---1-comes-from)).

## 1. The overall funnel, and where "5,000-10,000 -> 250 -> 5 -> 1" comes from

### Who owns the figure

The funnel belongs to **PhRMA** (Pharmaceutical Research and Manufacturers of America, the US industry trade association). It is not an FDA or NIH figure. Tracing it back:

| Year | PhRMA document | What it says | Cited source |
|---|---|---|---|
| 2000 | *Pharmaceutical Industry Profile 2000*, ch. 3, Figure 3-1 "Compound success rates by stages" ([course-site mirror](https://www.uvm.edu/~vgn/oldbioinformatics/vgn/1a_intro_genomics/PhRMA/PhRMA_Regulation.pdf)) | Of 5,000-10,000 molecules screened, one becomes an approved drug. The figure shows 250 entering preclinical testing and 5 entering clinical testing | "PhRMA, based on data from Center for the Study of Drug Development, Tufts University, 1995" |
| 2012 | *Pharmaceutical Industry Profile 2012*, Figure 12 ([PhRMA Japan copy](https://www.phrma-jp.org/wordpress/wp-content/uploads/old/library/industryprofile/20120329_Profile_2012.pdf)) | For every 5,000-10,000 compounds entering the pipeline, 5 reach clinical trials and 1 is approved. The figure shows 5,000-10,000 -> 250 -> 5 -> 1 | PhRMA, *Drug Discovery and Development: Understanding the R&D Process* (innovation.org) |
| 2015 | *Biopharmaceutical Research & Development: The Process Behind New Medicines* ([copy](https://invivobiosystems.com/wp-content/uploads/2022/09/rd_brochure_022307.pdf)) | The funnel graphic **no longer shows the numbers**: just "potential new medicines" narrowing to "1 FDA-approved medicine". The text says "thousands and sometimes millions of compounds" may be screened and gives clinical success as "less than 12%" | Tufts CSDD 2014 cost briefing, i.e. [DiMasi et al. 2016](https://doi.org/10.1016/j.jhealeco.2016.01.012) |

The only published study cited for the 2000 figure is [DiMasi 1995, *Clin Pharmacol Ther*](https://doi.org/10.1016/0009-9236(95)90066-7). That paper measures **clinical** success: of drugs entering trials in 1980-84, 23.5% were expected to reach approval. That fits the "5 -> 1" step (20%). It does not contain the 5,000-10,000 screened or 250 preclinical counts.

**Untraceable:** I found no published dataset behind "5,000-10,000 compounds" or "250 enter preclinical testing". The only attribution is "Tufts, 1995 data" with no specific publication. PhRMA itself dropped the numbers from its 2015 graphic. Treat the funnel as an illustrative 1990s industry rule of thumb, not a measurement.

The FDA's own patient page describes the discovery stage qualitatively, saying "thousands of compounds may be potential candidates" ([FDA, Step 1](https://www.fda.gov/patients/drug-development-process/step-1-discovery-and-development)).

### What the modern evidence implies instead

- **Early stage is much wider than 5,000-10,000.** A single industry project typically screens 200,000 to more than 10^6 compounds at the start. Hit-to-lead and lead optimisation then test hundreds more to arrive at one or two candidates, and only about 10% of small-molecule projects reach a candidate at all ([Hughes et al. 2011](https://doi.org/10.1111/j.1476-5381.2010.01127.x), authors from MedImmune, the University of Leicester and Lilly). This describes industry practice; it is not a counted dataset.
- **The clinical end is worse than "5 -> 1".** A 20% clinical success rate matches 1980s cohorts ([DiMasi 1995](https://doi.org/10.1016/0009-9236(95)90066-7)). Modern estimates are 7.9% to 13.8% (section 3), which works out to roughly 7 to 13 clinical candidates per approval (my arithmetic: 1/0.138 and 1/0.079).

## 2. Lab-scale throughput: how many compounds, how fast

| Measure | Figure | Source (year, setting) |
|---|---|---|
| Compounds screened per industry project | 200,000 to more than 1,000,000 | [Hughes et al. 2011](https://doi.org/10.1111/j.1476-5381.2010.01127.x) (industry review) |
| Duration of an HTS campaign | "Several million molecules over several weeks"; up to 200 assay plates per day | Same. At 1,536 wells per plate, 200 plates is up to about 300,000 wells per day (my arithmetic) |
| Ultra-HTS threshold | About 100,000 assays per day | [IUPAC glossary, Maclean et al. 1999](https://doi.org/10.1351/pac199971122349) ([entry](https://list.iupac.org/reports/1999/7112maclean/h-k.html)) |
| Early HTS (history) | Pfizer went from 800 compounds per week (1986) to 7,200 per week (1989). By 1992, HTS supplied starting hits for about 40% of its discovery portfolio | [Pereira & Williams 2007](https://doi.org/10.1038/sj.bjp.0707373) (Pfizer Groton) |
| Typical primary hit rates | Under 0.5% (agonist assays); 2-3% (antagonist assays, which also catch assay interference) | [Hughes et al. 2011](https://doi.org/10.1111/j.1476-5381.2010.01127.x) |
| Quantitative HTS at NIH | Full concentration-response curves for more than 60,000 compounds in one experiment; designed to profile more than 10^5 compounds | [Inglese et al. 2006, PNAS](https://doi.org/10.1073/pnas.0604348103) (NIH Chemical Genomics Center, now part of NCATS) |
| NCATS robotic capacity (current) | Primary system stores more than 3 million compound wells and more than 1.5 million assay wells, with multiple assays run in parallel. The Tox21 system screens a 10,000-compound library in triplicate | [NCATS Automation](https://ncats.nih.gov/preclinical/core/automation) (accessed Oct 2026) |
| NCATS libraries (June 2023) | Genesis 126,400; retired-pharma "PubChem collection" 45,879; NCATS Pharmaceutical Collection (NPC) of approved drugs 2,807 (v2.1); NPACT 5,099; MIPE oncology 2,803 | [NCATS Compound Management](https://ncats.nih.gov/research/research-activities/compound-management) |
| NIH Molecular Libraries Program (2004-2014) | Shared academic library (MLSMR) grew to about 390,000 compounds. Screening at the MLPCN centres produced 375 chemical probes | [Schreiber et al. 2015, Cell](https://doi.org/10.1016/j.cell.2015.05.023) |
| Same, as deposited in PubChem | 255,000 compounds by end of 2005; 406,000 by 2015, after which updates stopped | [Škuta et al. 2021, RSC Med Chem](https://doi.org/10.1039/d1md00138h) |

Disagreements and caveats:

- MLSMR size is reported as about 390,000 ([Schreiber 2015](https://doi.org/10.1016/j.cell.2015.05.023)) or 406,000 ([Škuta 2021](https://doi.org/10.1039/d1md00138h)). The difference is between the final screened library and everything deposited in PubChem.
- The authoritative industry account of corporate library sizes over time, [Macarron et al. 2011](https://doi.org/10.1038/nrd3368), Figure 2, is paywalled and I could not read it. Its library-size figures are therefore not quoted here.
- An AI company reports that typical HTS hit rates range from 0.001% to 0.151%, against 6-8% for its own virtual screening ([Atomwise, Sci Rep 2024](https://doi.org/10.1038/s41598-024-54655-z)). This is company-authored and the HTS range is cited second-hand, so treat it as indicative only. Note also how much lower it is than Hughes's 0.5-3%. Hit rates depend heavily on the assay and the cut-off.

## 3. Attrition: success rates by clinical phase

| Study (dataset, years) | Phase I -> II | Phase II -> III | Phase III -> submission | Submission -> approval | Phase I -> approval |
|---|---|---|---|---|---|
| [Hay et al. 2014, Nat Biotechnol](https://doi.org/10.1038/nbt.2786) (BioMedTracker; 835 companies; 7,372 development paths, 4,451 drugs; 2003-2011) | 64.5% | 32.4% | 50.0% (Phase III to approval, combined) | (included) | **10.4%** (oncology 6.7%) |
| [DiMasi et al. 2016](https://doi.org/10.1016/j.jhealeco.2016.01.012) (top 50 firms; 1,442 self-originated compounds first tested in humans 1995-2007) | - | - | - | - | **11.83%** (from first human testing) |
| [Wong, Siah & Lo 2019, Biostatistics](https://doi.org/10.1093/biostatistics/kxx069) (Citeline Trialtrove + Pharmaprojects; 21,143 compounds, 185,994 trials, 41,040 industry paths; 2000-2015) | 66.4% | 58.3% | 59.0% (Phase III to approval) | (included) | **13.8%** (oncology 3.4%; all except oncology 20.9%) |
| [BIO / Informa / QLS 2021](https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf) (Biomedtracker; 9,704 programs, 12,728 transitions, 1,779 companies; 2011-2020) | 52.0% | 28.9% | 57.8% | 90.6% | **7.9%** (oncology 5.3%; haematology 23.9%; urology 3.6%) |
| [FDA patient page](https://www.fda.gov/patients/drug-development-process/step-3-clinical-research) (undated, no dataset cited) | about 70% | about 33% | about 25-30% "move to the next phase" | - | not stated |

Disagreements:

- **7.9% vs 13.8%.** The headline figures differ mainly because of method. BIO and Hay use a "phase-by-phase" count of transitions. Wong et al. trace each program "path by path" and infer outcomes for programs that go quiet. Applied to their own data, Wong et al.'s phase-by-phase method gives **6.9%** ([Wong 2019](https://doi.org/10.1093/biostatistics/kxx069), Table 1). So the method alone roughly halves or doubles the answer. Wong et al. also note that both figures are far above the "1% to 3%" often quoted informally, because these rates start from Phase I, not from discovery.
- **Phase II is the hardest step** in Hay (32.4%) and BIO (28.9%). Wong's path-by-path method puts it much higher (58.3%).
- **The FDA's phase rates conflict with all three studies.** The FDA page cites no source or date, and its "25-30%" for Phase III conflicts with 57.8-59.0% in BIO and Wong. Prefer the cited studies.
- **Oncology is the worst area in every dataset:** 3.4% (Wong), 5.3% (BIO), 6.7% (Hay).

## 4. Drug repurposing specifically

### How common is repurposing among approvals?

- Of 1,336 new molecular entities and biologics approved by the FDA from 1985 to 2024, **451 later received approval for a different therapeutic use**, about 34% (my arithmetic). The mean gap from first approval to the new-use approval was 7.2 years ([Akodad et al. 2026, Commun Med](https://doi.org/10.1038/s43856-025-01344-1); dataset built from FDA regulatory documents). Oncology accounts for 35.5% of these repurposed approvals.
- Among the 197 small-molecule drugs approved from 1997 to 2020 that later faced generic competition, **64 (32%)** gained at least one new indication ([Sahragardjoonegani et al. 2021](https://doi.org/10.1186/s40545-020-00282-8)). The chance of a new indication fell to near zero by about 15 years after approval.
- **Untraceable:** the widely repeated claim that "repurposed drugs make up about 30% of new FDA approvals" has no primary analysis that I could find. Akodad et al. also repeat a second claim, that "about 30% of repurposing efforts succeed versus about 10% for new drugs", but they cite only secondary reviews for it. Do not use either number.

### Do repurposed or off-patent drugs do better in trials?

- From Phase I, **off-patent products** (non-NMEs plus biosimilars) were approved 14.7% of the time, against 6.8% for novel drugs. Non-NMEs alone reached 13.3%, against 5.7% for NMEs ([BIO 2021](https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf), 2011-2020). "Non-NME" includes new formulations and new uses of existing molecules, so this is a proxy for repurposing, not a clean measure of it.
- [Pushpakom et al. 2019](https://doi.org/10.1038/nrd.2018.168) ([accepted manuscript](https://livrepository.liverpool.ac.uk/3027906/)) is the standard review. It describes repurposing as three steps:
  1. Generating a hypothesis.
  2. Mechanistic testing in preclinical models.
  3. A Phase II efficacy trial, if earlier safety data exist.

  It argues that risk, time and cost are lower because the safety work is already done, while Phase III and regulatory costs stay about the same.
- **Untraceable:** Pushpakom's "about $300 million per repurposed drug vs about $2-3 billion for a new chemical entity" is sourced to a Nature news feature ([Nosengo 2016](https://doi.org/10.1038/534314a)), not to a cost study. I found no primary dataset for it.

### How many drugs are there to repurpose?

- 2,356 molecular entities are FDA-approved for human use and 3,936 worldwide. Another 4,935 have been registered for human testing without approval. Together that is about 8,969 compounds as the "universe" for repurposing ([Huang et al. 2011, Sci Transl Med](https://doi.org/10.1126/scitranslmed.3001862), NCGC Pharmaceutical Collection). NCATS currently keeps 2,900 approved molecules in its screening collection ([NCATS NPC page](https://ncats.nih.gov/research/research-resources/preclinical-research-toolbox/npc), updated July 2025). Its compound-management table lists 2,807 (NPC v2.1, approvals to Dec 2022).
- The **Broad Drug Repurposing Hub** at launch had 4,707 quality-checked compounds: 1,988 launched drugs, 1,347 that reached Phase 1-3, 86 withdrawn drugs, and 1,285 preclinical or tool compounds. These hit 2,006 human protein targets, and samples cost an average of $29 each. The authors estimate about 10,000 drugs have reached the clinic in the US and Europe ([Corsello et al. 2017, Nat Med](https://doi.org/10.1038/nm.4306)). The whole approved-drug library is small enough to screen in one HTS run.

### How often do computational predictions get tested, and how often do they validate?

- **Usually they are not tested.** A review of COVID-19 computational repurposing studies found that "the predictions were not followed-up by experimental validation in the majority of the studies reviewed" ([Galindez et al. 2021, Nat Comput Sci](https://doi.org/10.1038/s43588-020-00007-6)). This is a narrative review, so it gives no exact fraction. Gysi et al. likewise note that typically only a small subset of top candidates is ever tested ([Gysi et al. 2021](https://doi.org/10.1073/pnas.2025581118)).
- **When they are tested, a few validate.** [Gysi et al. 2021, PNAS](https://doi.org/10.1073/pnas.2025581118) is the clearest head-to-head test:
  - 12 AI, network-diffusion and network-proximity pipelines ranked 6,340 drugs. The rankings were frozen on 15 April 2020.
  - Afterwards, 918 of these drugs were screened in VeroE6 cells. Of these, 806 (87.8%) had no effect, 35 were cytotoxic, 37 had a strong effect and 40 a weak effect. That is **77 actives, about 8.4%** (my arithmetic).
  - The best single pipeline put 9 actives in its top 100. A consensus ranking did better, and the top-ranked drugs then tested in human cells succeeded 62% of the time, a small follow-up set.
  - 76 of the 77 actives do not bind the proteins SARS-CoV-2 targets. The authors argue such drugs "cannot be identified using docking-based strategies".
- **Unbiased lab screens show the same steep funnel.** [Riva et al. 2020, Nature](https://doi.org/10.1038/s41586-020-2577-1) screened the ReFRAME library of about 12,000 approved or clinical-stage drugs against SARS-CoV-2 in cells:
  - About 100 inhibited the virus.
  - 21 showed a dose-response relationship.
  - 13 had EC50 below 500 nM in at least one cell line, the potency the authors judged possibly achievable in patients.

  That is about 0.1% of the library (13 of about 12,000, my arithmetic). The authors note that chloroquine-type drugs worked in cells but not in trials.
- NCATS screened more than 10,000 compounds, including the whole NPC, in SARS-CoV-2 assays and released the data openly ([NCATS NPC page](https://ncats.nih.gov/research/research-resources/preclinical-research-toolbox/npc)).

### COVID-19: the biggest repurposing test so far

- **Volume:** ClinicalTrials.gov lists **1,785 interventional drug trials for COVID-19 starting in 2020-2021**, 617 of them Phase 3. It lists 234 interventional trials involving hydroxychloroquine (my query of the [ClinicalTrials.gov API v2](https://clinicaltrials.gov/data-api/api), condition "COVID-19", run 24 Oct 2026; this covers only that registry). FDA staff analysed the global trial landscape in [Bugin & Woodcock 2021](https://doi.org/10.1038/d41573-021-00037-3), but the article is paywalled and I did not quote its figures.
- **Most repurposed candidates failed.** The WHO Solidarity trial randomised 11,330 inpatients in 30 countries to four repurposed antivirals: remdesivir, hydroxychloroquine, lopinavir and interferon beta-1a. None definitely reduced mortality ([WHO Solidarity 2021, NEJM](https://doi.org/10.1056/NEJMoa2023184)).
- **A few succeeded.** Dexamethasone cut 28-day mortality from 25.7% to 22.9% (rate ratio 0.83) ([RECOVERY 2021, NEJM](https://doi.org/10.1056/NEJMoa2021436)).
- **Baricitinib is our known-answer case, and it is a real computational repurposing success:**
  - February 2020: BenevolentAI used its knowledge graph to propose baricitinib, citing AAK1 (viral entry) and its anti-inflammatory activity ([Richardson et al. 2020, Lancet](https://doi.org/10.1016/S0140-6736(20)30304-4)).
  - 2021: RECOVERY's 8,156-patient trial found 12% vs 14% 28-day mortality (rate ratio 0.87). A meta-analysis of all nine JAK-inhibitor trials showed a 20% mortality reduction ([RECOVERY 2022, Lancet](https://doi.org/10.1016/S0140-6736(22)01109-6)). RECOVERY describes baricitinib as a JAK1-2 inhibitor; the clinical benefit is generally read as immunomodulation rather than the AAK1 antiviral mechanism the hypothesis emphasised.
  - 10 May 2022: FDA approval for certain hospitalised adults ([FDA FAQ](https://www.fda.gov/media/143825/download)).

  From hypothesis to approval took about 27 months, with an emergency use authorisation in between.

## 5. Time and cost per stage (brief)

| Stage | Time | Cost | Source |
|---|---|---|---|
| Synthesis to first human test | 31.2 months on average (78 compounds) | Pre-human cost per approved drug: $430M out-of-pocket, $1,098M capitalised (2013 $) | [DiMasi et al. 2016](https://doi.org/10.1016/j.jhealeco.2016.01.012) |
| Phase I / II / III | Mean phase length 33.1 / 37.9 / 45.1 months | Mean out-of-pocket cost per compound entering each phase: $25.3M / $58.6M / $255.4M (2013 $) | DiMasi et al. 2016 |
| Phase I / II / III / regulatory review | 2.3 / 3.6 / 3.3 / 1.3 years; **10.5 years** Phase I to approval (2011-2020) | - | [BIO 2021](https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf) |
| Start of clinical testing to approval | 96.8 months (about 8 years) | - | DiMasi et al. 2016 |
| Whole pipeline, per approved drug | - | **$2,558M** capitalised ($1,395M out-of-pocket), 2013 $; 106 drugs from a confidential survey of 10 firms | DiMasi et al. 2016 |
| Whole pipeline, per approved drug | - | **Median $985.3M, mean $1,335.9M** (2018 $); 63 of 355 FDA approvals 2009-2018 with public SEC filings; oncology median $2,771.6M | [Wouters et al. 2020, JAMA](https://doi.org/10.1001/jama.2020.1166) |
| Repurposing, first approval to new-use approval | 7.2 years mean (1985-2024) | - | [Akodad et al. 2026](https://doi.org/10.1038/s43856-025-01344-1) |

Disagreement: Wouters et al. restate DiMasi's mean as $2.8 billion in 2018 dollars, against their own $1.3 billion. They attribute the gap to:

- DiMasi's confidential, unverifiable large-firm data;
- different success-rate assumptions;
- higher large-firm trial costs;
- preclinical cost assumptions.

PhRMA's "$2.6 billion" is DiMasi's figure ([PhRMA 2015](https://invivobiosystems.com/wp-content/uploads/2022/09/rd_brochure_022307.pdf)).

## What this means for our app

### Where the app sits in the funnel

The FDA describes five steps, and Step 1 is "Discovery and Development" ([FDA](https://www.fda.gov/patients/drug-development-process/step-1-discovery-and-development)). The app sits entirely inside Step 1, and within that, inside step 1 of Pushpakom's three repurposing steps: **hypothesis generation** ([Pushpakom 2019](https://doi.org/10.1038/nrd.2018.168)). Concretely:

- **Disease -> targets -> approved drugs (Open Targets, ChEMBL)** does what HTS does physically, but as a knowledge lookup. It narrows the roughly 2,400-4,000 approved molecules ([Huang 2011](https://doi.org/10.1126/scitranslmed.3001862)) to the ones acting on a disease-linked target, or on a protein close to one in the protein network. This is a "focused" or knowledge-based screen in the sense of [Hughes et al. 2011](https://doi.org/10.1111/j.1476-5381.2010.01127.x), Table 1.
- **The network-proximity ranking** is the same kind of step as the network-based pipelines in [Gysi et al. 2021](https://doi.org/10.1073/pnas.2025581118), and the model jury then reviews the shortlist. In that real test, the best single pipeline had 9 actives in its top 100, and the actives were cell-culture antiviral hits, not cures.
- **Docking (AutoDock Vina)** is a virtual screen. Pushpakom et al. list the known limits: missing structures, poorly curated structure databases, and weak affinity prediction. Gysi et al. found 76 of 77 cell-active drugs worked through mechanisms that docking against the virus-targeted proteins would miss. This supports the plan's rule (`plan.md` section 7) that a pose does not establish binding strength or efficacy.

### A realistic framing for students

Suggested copy for guided mode:

- "Real labs test drugs constantly. One industry screening project can test hundreds of thousands to over a million compounds in a few weeks. But fewer than 1 in 100 usually shows activity in that first test."
- "This app does the step before the lab: it suggests which already-approved drugs might be worth testing. In published tests of computer-ranked repurposing lists, roughly 1 in 10 tested drugs showed any effect in cells, and most of those never became treatments."
- "Of drugs that reach human trials, about 1 in 8 to 1 in 13 is eventually approved, and the trials take about 10 years."
- "Repurposing is a real shortcut. About a third of approved drugs later gained a different approved use, and baricitinib went from a computer-generated hypothesis in February 2020 to FDA approval for COVID-19 in May 2022. That is the exception, not the rule: in the WHO Solidarity trial, all four repurposed antivirals failed."

### Implications for product copy and the demo

- Keep calling outputs **candidates** or hypotheses, never "treatments". This matches the funnel: a candidate has not yet passed even the first lab assay.
- The **COVID-19/baricitinib known-answer check** fits well because it is a documented computational repurposing success. But the original hypothesis emphasised AAK1, while the benefit is attributed to JAK1/2 immunomodulation. That is worth saying in guided mode: a good ranking can be right for a partly different reason. It also supports the plan's rule (`plan.md` section 7) that a JAK2 structure must not be presented as JAK1 validation.
- Do not show a "probability of success". Use the base rates above as context instead. Model agreement and docking scores are not comparable to the 8%-14% clinical success rates.
- Avoid the untraceable numbers: "5,000-10,000 -> 250 -> 5 -> 1" (if used, label it "PhRMA illustration, 1990s"), "30% of approvals are repurposed", and "$300M per repurposed drug".

## Sources

Primary research and data:

1. Akodad S, et al. Impact of drug repurposing between 1985 and 2024 on pharmaceutical innovation. *Commun Med* 6, 84 (2026). https://doi.org/10.1038/s43856-025-01344-1
2. BIO, Informa Pharma Intelligence, QLS Advisors. *Clinical Development Success Rates 2011-2020* (Feb 2021). https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf
3. ClinicalTrials.gov API v2, query run 24 Oct 2026. https://clinicaltrials.gov/data-api/api
4. Corsello SM, et al. The Drug Repurposing Hub. *Nat Med* 23, 405-408 (2017). https://doi.org/10.1038/nm.4306
5. DiMasi JA. Success rates for new drugs entering clinical testing in the United States. *Clin Pharmacol Ther* 58, 1-14 (1995). https://doi.org/10.1016/0009-9236(95)90066-7
6. DiMasi JA, Grabowski HG, Hansen RW. Innovation in the pharmaceutical industry: new estimates of R&D costs. *J Health Econ* 47, 20-33 (2016). https://doi.org/10.1016/j.jhealeco.2016.01.012
7. Gysi DM, et al. Network medicine framework for identifying drug-repurposing opportunities for COVID-19. *PNAS* 118, e2025581118 (2021). https://doi.org/10.1073/pnas.2025581118
8. Hay M, et al. Clinical development success rates for investigational drugs. *Nat Biotechnol* 32, 40-51 (2014). https://doi.org/10.1038/nbt.2786 (figures taken from the comparison in Wong et al. 2019, Table 1)
9. Huang R, et al. The NCGC Pharmaceutical Collection. *Sci Transl Med* 3, 80ps16 (2011). https://doi.org/10.1126/scitranslmed.3001862
10. Inglese J, et al. Quantitative high-throughput screening. *PNAS* 103, 11473-11478 (2006). https://doi.org/10.1073/pnas.0604348103
11. RECOVERY Collaborative Group. Dexamethasone in hospitalized patients with Covid-19. *NEJM* 384, 693-704 (2021). https://doi.org/10.1056/NEJMoa2021436
12. RECOVERY Collaborative Group. Baricitinib in patients admitted to hospital with COVID-19. *Lancet* 400, 359-368 (2022). https://doi.org/10.1016/S0140-6736(22)01109-6
13. Richardson P, et al. Baricitinib as potential treatment for 2019-nCoV acute respiratory disease. *Lancet* 395, e30-e31 (2020). https://doi.org/10.1016/S0140-6736(20)30304-4
14. Riva L, et al. Discovery of SARS-CoV-2 antivirals through large-scale drug repositioning. *Nature* 586, 113-119 (2020). https://doi.org/10.1038/s41586-020-2577-1
15. Sahragardjoonegani B, et al. Repurposing existing drugs for new uses: a cohort study of the frequency of FDA-granted new indication exclusivities since 1997. *J Pharm Policy Pract* 14, 3 (2021). https://doi.org/10.1186/s40545-020-00282-8
16. Škuta C, Southan C, Bartůněk P. Will the chemical probes please stand up? *RSC Med Chem* 12, 1428-1441 (2021). https://doi.org/10.1039/d1md00138h
17. WHO Solidarity Trial Consortium. Repurposed antiviral drugs for Covid-19 - interim WHO Solidarity trial results. *NEJM* 384, 497-511 (2021). https://doi.org/10.1056/NEJMoa2023184
18. Wong CH, Siah KW, Lo AW. Estimation of clinical trial success rates and related parameters. *Biostatistics* 20, 273-286 (2019). https://doi.org/10.1093/biostatistics/kxx069
19. Wouters OJ, McKee M, Luyten J. Estimated research and development investment needed to bring a new medicine to market, 2009-2018. *JAMA* 323, 844-853 (2020). https://doi.org/10.1001/jama.2020.1166
20. Wallach I, et al. (Atomwise AIMS Program). AI is a viable alternative to high throughput screening: a 318-target study. *Sci Rep* 14, 7526 (2024). https://doi.org/10.1038/s41598-024-54655-z (company-authored)

Agency and institutional pages:

21. FDA. The Drug Development Process, Step 1: Discovery and Development. https://www.fda.gov/patients/drug-development-process/step-1-discovery-and-development
22. FDA. Step 3: Clinical Research. https://www.fda.gov/patients/drug-development-process/step-3-clinical-research
23. FDA CDER. Novel Drug Approvals for 2024. https://www.fda.gov/drugs/novel-drug-approvals-fda/novel-drug-approvals-2024
24. FDA. Frequently Asked Questions on Olumiant (baricitinib) for the treatment of COVID-19 (10 May 2022). https://www.fda.gov/media/143825/download
25. NCATS. Automation. https://ncats.nih.gov/preclinical/core/automation
26. NCATS. Compound Management. https://ncats.nih.gov/research/research-activities/compound-management
27. NCATS. NCATS Pharmaceutical Collection. https://ncats.nih.gov/research/research-resources/preclinical-research-toolbox/npc
28. Maclean D, et al. Glossary of terms used in combinatorial chemistry (IUPAC Recommendations 1999). *Pure Appl Chem* 71, 2349-2365 (1999). https://doi.org/10.1351/pac199971122349

Reviews and industry documents (used for definitions, practice descriptions and tracing claims):

29. Galindez G, et al. Lessons from the COVID-19 pandemic for advancing computational drug repurposing strategies. *Nat Comput Sci* 1, 33-41 (2021). https://doi.org/10.1038/s43588-020-00007-6
30. Hughes JP, Rees S, Kalindjian SB, Philpott KL. Principles of early drug discovery. *Br J Pharmacol* 162, 1239-1249 (2011). https://doi.org/10.1111/j.1476-5381.2010.01127.x
31. Pereira DA, Williams JA. Origin and evolution of high throughput screening. *Br J Pharmacol* 152, 53-61 (2007). https://doi.org/10.1038/sj.bjp.0707373
32. Pushpakom S, et al. Drug repurposing: progress, challenges and recommendations. *Nat Rev Drug Discov* 18, 41-58 (2019). https://doi.org/10.1038/nrd.2018.168 (accepted manuscript: https://livrepository.liverpool.ac.uk/3027906/)
33. Schreiber SL, et al. Advancing biological understanding and therapeutics discovery with small-molecule probes. *Cell* 161, 1252-1265 (2015). https://doi.org/10.1016/j.cell.2015.05.023
34. PhRMA. *Pharmaceutical Industry Profile 2000*, chapter 3 (mirror): https://www.uvm.edu/~vgn/oldbioinformatics/vgn/1a_intro_genomics/PhRMA/PhRMA_Regulation.pdf
35. PhRMA. *Pharmaceutical Industry Profile 2012* (PhRMA Japan copy): https://www.phrma-jp.org/wordpress/wp-content/uploads/old/library/industryprofile/20120329_Profile_2012.pdf
36. PhRMA. *Biopharmaceutical Research & Development: The Process Behind New Medicines* (2015, copy): https://invivobiosystems.com/wp-content/uploads/2022/09/rd_brochure_022307.pdf

Cited but not read in full (paywalled):

- Macarron R, et al. Impact of high-throughput screening in biomedical research. *Nat Rev Drug Discov* 10, 188-195 (2011). https://doi.org/10.1038/nrd3368
- Bugin K, Woodcock J. Trends in COVID-19 therapeutic clinical trials. *Nat Rev Drug Discov* 20, 254-255 (2021). https://doi.org/10.1038/d41573-021-00037-3
- Nosengo N. Can you teach old drugs new tricks? *Nature* 534, 314-316 (2016). https://doi.org/10.1038/534314a (news feature; the origin of Pushpakom's $300M figure)
