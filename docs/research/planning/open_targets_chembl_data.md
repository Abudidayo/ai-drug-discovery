# Open Targets GraphQL + ChEMBL / PubChem / RCSB PDB integration cookbook (live-verified 24 Oct 2026)

> **Older research snapshot.** Where this note differs from `plan.md`, follow `plan.md`. In particular: docking runs AutoDock Vina on CPU (no rented GPUs), the Model jury uses three Snowflake Cortex model families (no Gemini), and IDs are mapped through UniProt and Ensembl IDs, never gene symbols.


**Everything below marked "verified" was executed live from this machine on 24 Oct 2026 (UTC ~12:40–13:30).** Versions hit: **Open Targets Platform 26.09** (API `26.9.0`, `dataPrefix: platform2609`, data published 2026-09-18) and **ChEMBL_37** (released 2026-05-01). Latencies are single-sample wall-clock from one UK-ish consumer connection; treat as order-of-magnitude.

---

## Q1. What are the current exact queries, field names and identifiers, and do they work right now?

### Takeaway
All eight cookbook calls work today, but the Open Targets **26.09 release renamed the entire known-drug surface**: `knownDrugs` is gone and replaced by `drugAndClinicalCandidates` → `clinicalReports`, with **zero deprecated fields in the schema** (verified by introspection), so any tutorial, blog post or LLM-generated query written before Sept 2026 will fail outright rather than warn. ChEMBL, PubChem and RCSB are stable, with two live gotchas: PubChem silently renamed `CanonicalSMILES`→`SMILES`/`ConnectivitySMILES`, and RCSB returns **HTTP 204 with an empty body** (not a 200 with zero hits) when a search matches nothing.

### Cited Findings — platform version and schema state

- `POST https://api.platform.opentargets.org/api/v4/graphql` with `query { meta { name product apiVersion { x y z } dataVersion { year month iteration } dataPrefix enableDataReleasePrefix } }` → **175 ms**, `{"name":"Open Targets GraphQL & REST API Beta","product":"platform","apiVersion":{"x":"26","y":"9","z":"0"},"dataVersion":{"year":"26","month":"09","iteration":null},"dataPrefix":"platform2609","enableDataReleasePrefix":true}` — verified live.
- Full introspection: **484 ms, 191,978 bytes**. Response headers include a custom **`gql-complexity`** header (e.g. `54.0` for introspection) — useful for self-throttling. Server is `nginx/1.31.8` behind Google Cloud (`Via: 1.1 google`). Verified live.
- **No field or enum value in the whole schema carries `isDeprecated: true`.** Verified by `fields(includeDeprecated: true)` + `enumValues(includeDeprecated: true)` across every type. Renames are hard breaks.
- Root `Query` fields (verified): `meta`, `target(ensemblId)`, `targets(ensemblIds)`, `disease(efoId)`, `diseases(efoIds)`, `drug(chemblId)`, `drugs(chemblIds)`, `search`, `facets`, `mapIds`, `associationDatasources`, `interactionResources`, `geneOntologyTerms`, `variant`, `study`, `studies`, `credibleSet`, `credibleSets`, **`clinicalReport(clinicalReportId)`**, **`clinicalReports(clinicalReportsIds)`**.
- 26.09 release notes: "`knownDrugs` replaced by **`drugAndClinicalCandidates`**", which nests `clinicalReports` (`ClinicalReport`); new fields `trialSponsor`, `origin`, `provider`, `trialLiterature`; `type` now means `INDICATION | SAFETY`; `hasExpertReview` removed; `chemical_probes` dataset renamed `chemical_probe`; `probeMinerScore` dropped; `hasTEP` removed from target prioritisation; `canonicalTranscript.strand` is now a `Strand` enum — [Open Targets release notes](https://platform-docs.opentargets.org/release-notes).
- Earlier 2025–26 changes from the same release-notes page: **25.03** "now only parquet file format is available", dataset names became snake_case singular, and "Filtered out Phase IV trial evidence that lacks regulatory approval for the specific indication"; **25.06** downloads moved to the Croissant JSON-LD standard; **25.09** "99% of evidence now has a date (`evidenceDate`)"; **25.12** removed PROGENy, SLAPenrich and Gene Signatures (SysBio) from associations, download files split by data source; **26.03** new clinical mining pipeline feeding the "Clinical Precedence" association feed, data published on AWS, OpenSearch→ClickHouse giving "~2×" faster API queries; **26.06** updated to **ChEMBL 37 and EFO 3.88** ("EFO 3.88 replaces many disease IDs with Mondo IDs"), LLM-based drug–disease extraction from AACT, NCT identifier search — [Open Targets release notes](https://platform-docs.opentargets.org/release-notes).
- Fields that **do not exist** on `Drug` in 26.09 (verified by introspection; all appear in pre-2024 tutorials): `isApproved`, `hasBeenWithdrawn`, `blackBoxWarning`, `maximumClinicalTrialPhase`, `linkedDiseases`, `linkedTargets`, `knownDrugs`. The replacements are `maximumClinicalStage: String!`, `drugWarnings: [DrugWarning!]!`, `indications: clinicalIndicationsFromDrugImp!`.

### Cited Findings — (1) disease search → stable disease ID

```graphql
query SearchDisease($q: String!) {
  search(queryString: $q, entityNames: ["disease"], page: {index: 0, size: 5}) {
    total hits { id name entity description score } } }
```
- `"COVID-19"` → **97 ms**, `total: 1`, `MONDO_0100096 | COVID-19 | score 3577.0`.
- `"multiple myeloma"` → **127 ms**, `total: 438`, top hit `MONDO_0009693 | plasma cell myeloma | score 4170.7` (note the label is *plasma cell myeloma*, not "multiple myeloma"; "Multiple Myeloma" is an `hasExactSynonym`).
- `"covid"` (fuzzy) → 9 hits, top is `MONDO_0100233 long COVID-19` — **free-text search does not rank the obvious answer first for partial strings**; always show the user the hit list.
- 5 repeat samples of the MM search: **320, 174, 116, 211, 168 ms**.
- Exact-string normalisation is better served by `mapIds`:
```graphql
query MapIds($terms: [String!]!) {
  mapIds(queryTerms: $terms, entityNames: ["disease","target","drug"]) {
    total mappings { term hits { id name entity score } } } }
```
→ **107 ms**: `COVID-19→MONDO_0100096 (score 1)`, `multiple myeloma→MONDO_0009693 (1)`, `baricitinib→CHEMBL2105759 (1)`, `Olumiant→CHEMBL2105759 (1)`, `JAK1→ENSG00000162434 (1)`, `lenalidomide→CHEMBL848 (1)`. Verified live.
- `search(queryString: "NCT04401579")` → **131 ms**, returns the disease + both drugs of that trial (`MONDO_0100096`, `CHEMBL2105759`, `CHEMBL4065616`) — the 26.06 "NCT identifier search" feature, verified live.
- Disease metadata: `query { disease(efoId:"MONDO_0100096"){ id name description dbXRefs obsoleteTerms therapeuticAreas{id name} parents{id name} synonyms{relation terms} } }` → **106 ms**. COVID-19: TA `infectious disease`, parent `MONDO_0020753`, xrefs `DOID:0080600, ICD10CM:U07.1, MESH:D000086382, SCTID:840539006, UMLS:C5203670`. MM: 4 therapeutic areas, xrefs include `EFO:0001378` and `obsoleteTerms: ["HP_0006775","EFO_0001378"]` — **`EFO_0001378` is the legacy multiple-myeloma ID and is now obsolete**; use `obsoleteTerms` to detect stale IDs in saved experiment history.

### Cited Findings — (2) disease → associated targets with per-datatype scores

```graphql
query Assoc($id: String!, $i: Int!, $size: Int!) {
  disease(efoId: $id) {
    associatedTargets(page: {index: $i, size: $size}) {
      count
      datasources { id weight propagate required }
      rows { target { id approvedSymbol } score
             datatypeScores { id score } datasourceScores { id score } } } } }
```
- COVID-19 (`MONDO_0100096`): `count 8235`, size 25 → **193–200 ms, 8.8 kB**, `gql-complexity 303`. Top rows: `TYK2 0.687 (genetic_association 0.96, literature 0.60, clinical 0.61)`, `ACE2 0.684`, `IFNAR2 0.647`, `IL10RB 0.613`, `TMPRSS2 0.602`, `ABO 0.594`; **JAK1 is #25 at 0.540 (genetic_association 0.71, clinical 0.68, literature 0.25)**.
- MM (`MONDO_0009693`): `count 5341`, **168 ms**. Top: `CRBN 0.708`, `TNFRSF17 0.680`, `TP53 0.670`, `LIG4 0.662`, `KRAS 0.661`, `CXCR4 0.659`, `FGFR3 0.645`, `NRAS 0.642`, `XPO1 0.642`, `CD38 0.627`, then a wall of proteasome subunits (`PSMB8/PSMA3/PSMA4/PSMB5/PSMB4/PSMB6` all ≈0.61 with `clinical 0.99`).
- **Pagination limit is 3000.** `size: 10000` → HTTP 200 with a GraphQL error: *"There was a pagination error. You used size 10000 but the size must be between 0 and 3000"*. `size: 3000` → **1.5–2.7 s, 0.5–0.8 MB per page, `gql-complexity 36001`** (no complexity rejection observed). Full COVID sweep = 3 pages ≈ 6.1 s; full MM sweep = 2 pages ≈ 4.1 s. Verified live.
- `associatedTargets.datasources` echoes only the **non-default weights**: `europepmc 0.2, expression_atlas 0.2 (propagate false), impc 0.2, cancer_biomarkers 0.5, ot_crispr_validation 0.5, ot_crispr 0.5, encore 0.5`. Everything else defaults to weight 1.0. Verified live.
- **Root `associationDatasources` returns an empty array** (`query { associationDatasources { datasource datatype } }` → **77 ms**, `[]`). The datasource→datatype map must be reconstructed from `datatypeScores`/`datasourceScores` on real rows. Verified live; this looks like a regression.
- Datasource→datatype map reconstructed from all 13,576 COVID+MM rows (verified): `genetic_association: gene_burden, gwas_credible_sets` · `clinical: clinical_precedence` · `literature: europepmc` · `affected_pathway: reactome, crispr` · `rna_expression: expression_atlas` · `somatic_mutation: cancer_gene_census, eva_somatic, intogen` · `animal_model: impc`. Unresolvable by this method because they never appear alone: `cancer_biomarkers`, `eva`, `genomics_england`, `uniprot_literature`. A `genetic_literature` datatype also exists (seen on MM `LIG4 genetic_literature 0.76`).
- **The old `known_drug` datatype / `chembl` datasource names are gone** — the clinical channel is now datatype `clinical`, datasource `clinical_precedence`. Verified live against the data; consistent with the 26.03 release note introducing the "Clinical Precedence" feed.

### Cited Findings — (3) disease → known drugs / clinical candidates

```graphql
query DiseaseDrugs($id: String!) {
  disease(efoId: $id) {
    drugAndClinicalCandidates {
      count
      rows {
        id maxClinicalStage
        drug { id name drugType maximumClinicalStage
               parentMolecule { id name }
               mechanismsOfAction { rows { mechanismOfAction actionType targets { id approvedSymbol } } } }
        clinicalReports { id source provider type clinicalStage trialPhase phaseFromSource
                          trialOverallStatus year url title } } } } }
```
- COVID-19 → **778 ms, 1.04 MB**, `count 540`. Stage mix: `PHASE_3 212, PHASE_2 166, PHASE_2_3 64, UNKNOWN 47, PHASE_1_2 24, PHASE_1 20, EARLY_PHASE_1 6, APPROVAL 1`. Report sources: `ClinicalTrials.gov 1926 (provider AACT), USAN 41, INN 15, FDA 1`.
- MM → **1196 ms, 2.86 MB**, `count 553`; `APPROVAL 38, PHASE_2 205, PHASE_1 129, PHASE_1_2 92, PHASE_3 64, IND 5`. Sources: `ClinicalTrials.gov 5426, TTD 137, EMA Human Drugs 46, DailyMed 43, USAN 20, PMDA 15, FDA 9`.
- **There is no `size`/`page` argument on `drugAndClinicalCandidates`** — it returns everything. For MM that is a 2.9 MB payload; budget for it or go to Parquet.
- Single-report lookup works and is rich: `query { clinicalReport(clinicalReportId: "nct04401579") { ... } }` → **99 ms**: `source ClinicalTrials.gov`, `provider AACT`, `clinicalStage PHASE_3`, `trialOverallStatus COMPLETED`, `trialStartDate 2020-05-08`, `trialSponsor {name "National Institute of Allergy and Infectious Diseases (NIAID)", agencyClass "NIH"}`, `trialNumberOfArms 2`, `trialPrimaryPurpose TREATMENT`, `trialLiterature` = 7 DERIVED PMIDs (33148977, 33306283, 34473343, 35695334, 36442063, 38408357, 38618926), `drugs` = remdesivir + baricitinib, title "…(ACTT-2)". **This is the single best object for a student-facing evidence card.** Verified live.
- `ClinicalReport.year` was `null` on every ClinicalTrials.gov report inspected; `trialStartDate` is populated. Use `trialStartDate`, not `year`, for time filters.

### Cited Findings — (4) target → drugs acting on it

```graphql
query TargetDrugs($ids: [String!]!) {
  targets(ensemblIds: $ids) {
    id approvedSymbol
    drugAndClinicalCandidates {
      count
      rows { id maxClinicalStage
             drug { id name drugType maximumClinicalStage parentMolecule { id name } }
             diseases { diseaseFromSource disease { id name } } } } } }
```
- Row counts (verified): `JAK1 25` (**137 ms**), `JAK2 31`, `TYK2 17`, `CRBN 4`, `PSMB5 7`, **`AAK1 0`**.
- Batching works well: `targets(ensemblIds: [...200 ids])` with this selection → **571 ms, 0.20 MB, `gql-complexity 1600`**. 25-id chunks run in 91–209 ms. This is the efficient way to fan out from a ranked target list.
- **`row.maxClinicalStage` ≠ `drug.maximumClinicalStage`.** The JAK1 row for baricitinib is `PHASE_4` while the drug record is `APPROVAL`; CRBN's lenalidomide row is **`WITHDRAWAL`**. Row stage = max stage *for that target–drug pair*; drug stage = max across all indications. Verified live.
- `maxClinicalStage` enum values observed in the wild: `APPROVAL, WITHDRAWAL, PHASE_4, PHASE_3, PHASE_2_3, PHASE_2, PHASE_1_2, PHASE_1, EARLY_PHASE_1, IND, UNKNOWN`.

### Cited Findings — (5) drug safety

```graphql
query DrugSafety($id: String!) {
  drug(chemblId: $id) {
    id name drugType maximumClinicalStage description
    tradeNames { label source } crossReferences { source ids }
    drugWarnings { warningType toxicityClass description country year
                   efoId efoTerm efoIdForWarningClass chemblIds
                   references { id source url } }
    adverseEvents(page: {index: 0, size: 10}) { count criticalValue rows { name meddraCode count logLR } }
    mechanismsOfAction { uniqueActionTypes uniqueTargetTypes
                         rows { mechanismOfAction actionType targetName targets { id approvedSymbol }
                                references { source ids urls } } }
    indications { count rows { id maxClinicalStage disease { id name }
                               clinicalReports { id source clinicalStage year } } } } }
```
- Baricitinib (`CHEMBL2105759`) → **135 ms, 32 kB, `gql-complexity 123`**. Four `Black Box Warning` rows: toxicityClass `vascular toxicity` (`efoIdForWarningClass EFO:0011062`), `carcinogenicity` (`EFO:0011046`), `respiratory toxicity` (`EFO:0011060`), `infectious disease` (`EFO:0005741`), all `country: United States`, all referencing DailyMed setid `866e9f35-9035-4581-a4b1-75a621ab55cf`. `description` and `year` were `null` on all four. `tradeNames: [Olumiant (ChEMBL)]`, `crossReferences: drugbank DB11817, Probes&Drugs PD010550`. Verified live.
- `adverseEvents` for baricitinib: `count 23, criticalValue 19.139`; top rows `deep vein thrombosis (67 reports, logLR 80.4)`, `therapy interrupted (35, 66.2)`, `pulmonary embolism (63, 63.1)`, `covid-19 (47, 63.0)`, `herpes zoster (39, 38.5)`. **`meddraCode` came back as an empty string on every row.** These are FAERS disproportionality signals (`logLR` vs `criticalValue` threshold), not incidence rates — label them carefully for students.
- A 6-drug batch (`drugs(chemblIds: [...])` with warnings + 5 adverse events) → **3441 ms, `gql-complexity 252`** — the adverse-event sub-query is the expensive part; fetch it lazily per selected drug, not for a whole candidate list.
- `drugWarnings` is sparse: thalidomide has `Black Box Warning/teratogenicity`, `Black Box Warning/vascular toxicity` **and `Withdrawn/teratogenicity/Finland/1963`**; lenalidomide has 5 black-box classes; pomalidomide 2; **bortezomib, venetoclax and selinexor returned zero warning rows** despite real label warnings. Absence of a warning is not evidence of safety.
- ChEMBL mirrors the same warnings: `GET /chembl/api/data/drug_warning.json?molecule_chembl_id=CHEMBL2105759` → **171 ms**, the same four black-box classes with `warning_refs` to DailyMed; `CHEMBL468` (thalidomide) → **117 ms**, includes `('Withdrawn','teratogenicity','Finland',1963)`.

### Cited Findings — (6) ChEMBL molecule details

- Base `https://www.ebi.ac.uk/chembl/api/data`. `GET /status.json` → **1799 ms cold**: `{"chembl_db_version":"ChEMBL_37","chembl_release_date":"2026-05-01","activities":24527044,"compound_records":3824604,"disinct_compounds":2921148,"publications":101100,"targets":18552,"status":"UP"}` (note the upstream typo `disinct_compounds`). Responses carry `Cache-Control: max-age=30000000`.
- `GET /molecule/CHEMBL2105759.json` → **186 ms**: `max_phase "4.0"` (a **string**, not a number, in ChEMBL 37), `first_approval 2017`, `black_box_warning 1`, `withdrawn_flag false`, `oral true`, `therapeutic_flag true`, `chirality 2`, `atc_classifications ["L04AF02"]`, `usan_stem_definition "tyrosine kinase inhibitors: tyrosine kinase inhibitors; janus kinase inhibitors"`. `molecule_structures.canonical_smiles = CCS(=O)(=O)N1CC(CC#N)(n2cc(-c3ncnc4[nH]ccc34)cn2)C1`, `standard_inchi_key = XUZMWHLSFXCVMG-UHFFFAOYSA-N`. `molecule_properties`: `full_mwt 371.43, alogp 1.10, psa 120.56, hba 7, hbd 1, rtb 5, num_ro5_violations 0, qed_weighted 0.72, heavy_atoms 26`.
- `GET /mechanism.json?molecule_chembl_id=CHEMBL2105759` → **99 ms**: two rows, `Tyrosine-protein kinase JAK1 inhibitor` (`CHEMBL2835`) and `JAK2 inhibitor` (`CHEMBL2971`), both `action_type INHIBITOR, direct_interaction 1, disease_efficacy 1`, each with `mechanism_refs [('PubMed','20363976')]`.
- `GET /drug_indication.json?molecule_chembl_id=CHEMBL2105759&limit=100` → **358 ms**, `total_count 33`. Includes `MONDO:0100096 | COVID-19 | max_phase_for_ind 3.0` with 17 NCT ids, and `EFO:0000685 | rheumatoid arthritis | 4.0`.
- `GET /activity.json?molecule_chembl_id=CHEMBL2105759&pchembl_value__isnull=false&limit=1000&only=...` → **2232 ms**, `total_count 142`. Human aggregates (median/max pChEMBL): **JAK1 n=26 med 8.23 max 9.15; JAK2 n=30 med 8.24 max 9.10; AAK1 n=9 med 8.09 max 8.09; TYK2 n=13 med 7.28 max 8.06; JAK3 n=9 med 6.60**.
- **`limit` is hard-capped at 1000**: requesting `limit=1001` silently returns `page_meta.limit: 1000`. Verified live. Use `offset`/`page_meta.next` to page.
- Target resolution by UniProt: `GET /target.json?target_components__accession=P23458` → **162 ms**, returns **9 targets** for JAK1 — one `SINGLE PROTEIN` (`CHEMBL2835`) plus families, complexes and PPI entries (`JAK3/JAK1`, `JAK1/JAK2/TYK2`, `Protein cereblon/JAK1`…). **Always filter `target_type=SINGLE PROTEIN`** or you will double-count activities. Same for P28074 (PSMB5 → `CHEMBL4662` single protein + `26S proteasome` + `20S proteasome`) and Q96SW2 (CRBN → `CHEMBL3763008` + 19 complexes/PPIs).
- `GET /molecule/search.json?q=olumiant` → **603 ms**, 2 hits, `CHEMBL2105759 BARICITINIB` second. Free-text ChEMBL search is noisier than Open Targets `mapIds`.
- Lenalidomide (`CHEMBL848`) → **161 ms**: `max_phase "4.0"`, `first_approval 2005`, `black_box_warning 1`, SMILES `Nc1cccc2c1CN(C1CCC(=O)NC1=O)C2=O`. Its only mechanism row is `CRL4(CRBN) E3 ubiquitin ligase inhibitor` against the **complex** `CHEMBL3833061`, not the CRBN single protein — a molecular-glue gotcha. Its direct CRBN binding activities are weak (18 pChEMBL values, 4.42–6.1).

### Cited Findings — (7) PubChem 2D depiction / properties

- `GET https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/baricitinib/cids/JSON` → **665 ms**, `CID 44205240`. Response header observed live: `X-Throttling-Control: Request Count status: Green (0%), Request Time status: Green (0%), Service status: Green (13%)` — poll this header to self-throttle.
- **Property-name change, verified live:** requesting `/property/CanonicalSMILES,IsomericSMILES/JSON` returns keys **`SMILES` and `ConnectivitySMILES`** — the legacy names are accepted as input but the output keys have changed, so code keyed on `CanonicalSMILES` breaks silently. Working call: `/compound/cid/44205240/property/MolecularFormula,MolecularWeight,SMILES,ConnectivitySMILES,InChIKey,IUPACName,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Charge/JSON` → **907 ms**: `C16H17N7O2S`, MW `371.4`, `XLogP -0.5`, `TPSA 129`, IUPAC `2-[1-ethylsulfonyl-3-[4-(7H-pyrrolo[2,3-d]pyrimidin-4-yl)pyrazol-1-yl]azetidin-3-yl]acetonitrile`.
- 2D depiction: `GET /compound/cid/44205240/PNG?image_size=400x400` → **607 ms, 6,670 bytes, `Content-Type: image/png`**. Can be used directly as an `<img src>`; no API key needed.
- 3D conformer for docking: `GET /compound/cid/44205240/SDF?record_type=3d` → **485 ms, 7,989 bytes**, 43 atoms / 46 bonds, header line `-OEChem-10242608443D`. This is a ready ligand input for Vina/DiffDock when no co-crystal pose exists.
- `/synonyms/JSON` → **511 ms**, 102 synonyms (`Olumiant`, `LY3009104`, `INCB028050`, CAS `1187594-09-7`). `/xrefs/PatentID/JSON` → **2196 ms, 12,392 patent IDs** — do not fetch this in a UI path.
- `GET /pug_view/data/compound/44205240/JSON?heading=Drug%20Warnings` → **346 ms, 2,003 bytes** (PUG-View, a separate service from PUG-REST, for curated label text).
- **Biologics have no CID**: `/compound/name/daratumumab/...` → **HTTP 404 `PUGREST.NotFound`** in 190 ms. Guard every antibody/CAR-T candidate before calling PubChem.
- Rate-limit policy (**not verified against the primary page** — pubchem.ncbi.nlm.nih.gov/docs/programmatic-access served a reCAPTCHA interstitial to both WebFetch attempts): secondary sources state no more than 5 requests/second, 400 requests/minute and 300 seconds total request time per minute, with dynamic throttling signalled in the HTTP header — [PubChem programmatic access (as summarised in search results)](https://pubchem.ncbi.nlm.nih.gov/docs/programmatic-access).

### Cited Findings — (8) RCSB PDB

- Search API `POST https://search.rcsb.org/rcsbsearch/v2/query`; Data API `https://data.rcsb.org` + `https://data.rcsb.org/graphql`; ModelServer `https://models.rcsb.org`; files `https://files.rcsb.org`. Typical latency **356–718 ms** per call across ~60 live calls.
- Structures for a target UniProt with any bound ligand (sorted by resolution):
```json
{"query": {"type":"group","logical_operator":"and","nodes":[
  {"type":"terminal","service":"text","parameters":{"attribute":"rcsb_polymer_entity_container_identifiers.reference_sequence_identifiers.database_accession","operator":"exact_match","value":"O60674"}},
  {"type":"terminal","service":"text","parameters":{"attribute":"rcsb_entry_info.nonpolymer_entity_count","operator":"greater","value":0}}]},
 "return_type":"entry",
 "request_options":{"paginate":{"start":0,"rows":5},"results_content_type":["experimental"],
   "sort":[{"sort_by":"rcsb_entry_info.resolution_combined","direction":"asc"}]}}
```
→ counts verified live: `JAK1 (P23458) 47`, `JAK2 (O60674) 167`, `TYK2 (P29597) 51`, `AAK1 (Q2M2I8) 6`, `CRBN (Q96SW2) 111`, `PSMB5 (P28074) 136`, `CD38 (P28907) 47`, `BCL2 (P10415) 48`, `XPO1 (O14980) 12`, `BCMA/TNFRSF17 (Q02223) 5`, **`SLAMF7 (Q9NQ25) 0`**.
- Drug → PDB chemical component via ChEMBL cross-reference (`return_type: "mol_definition"`, service `text_chem`, attribute `rcsb_chem_comp_related.resource_accession_code`): baricitinib `CHEMBL2105759 → 3JW`, tofacitinib → `MI1`, ruxolitinib → `RXT`, bortezomib → `BO2`, ixazomib → `6V8`, venetoclax → `LBM`, panobinostat → `LBH`, filgotinib → `2HB`, momelotinib → `C87`, delgocitinib → `FHX`. Verified live, ~360–590 ms each.
- **The ChEMBL xref route returns HTTP 204 for lenalidomide, pomalidomide, thalidomide, carfilzomib and selinexor.** Fallback that works: fetch the ChEMBL SMILES then run a chemical-descriptor search —
```json
{"query":{"type":"terminal","service":"chemical","parameters":{"value":"<SMILES>","type":"descriptor","descriptor_type":"SMILES","match_type":"graph-relaxed-stereo"}},"return_type":"mol_definition"}
```
→ lenalidomide `LVY` (plus DUI, Y70), pomalidomide `Y70`, thalidomide `EF2` (S) / `6EL` (R). Verified live (~500 ms). Carfilzomib and selinexor still return 204 because they bind **covalently** and the PDB component is the adduct (carfilzomib → `3BV`, selinexor → `V6A`, both found instead by a `full_text` search ANDed with the UniProt filter).
- **`full_text` alone is useless for drug names**: searching `"lenalidomide"` with `return_type: mol_definition` returns `ALA, ARG, ASN, ASP, CYS` (amino acids). Always AND it with a structural constraint.
- Entry metadata in one GraphQL call (`entries(entry_ids: [...])` with `struct{title}`, `exptl{method}`, `rcsb_entry_info{resolution_combined, polymer_entity_count, deposited_polymer_monomer_count}`, `rcsb_accession_info{initial_release_date}`, `polymer_entities{...uniprot_ids, auth_asym_ids}`, `nonpolymer_entities{nonpolymer_comp{chem_comp{id name}}}`) → **487–718 ms for 16–20 entries**. This gives everything a docking UI needs (chain ids, residue count, ligand codes) in one round trip.
- File endpoints all verified: `files.rcsb.org/download/6WTO.cif` (**370 ms, 507,911 B**), `.pdb` (**1020 ms, 415,125 B**), `files.rcsb.org/ligands/download/3JW_ideal.sdf` (**367 ms, 3,059 B** — idealised ligand for redocking), `models.rcsb.org/v1/6WTO/ligand?label_comp_id=3JW&encoding=sdf` (**691 ms, 3,160 B** — **the experimental bound pose**, i.e. your RMSD ground truth), `data.rcsb.org/rest/v1/core/entry/6WTO` (**477 ms, 14,633 B**).
- Rate limits: "all RCSB PDB APIs have rate limits in place"; "We recommend starting with a handful of requests per second"; "If you exceed the limit, the service will respond with a 429 HTTP error code"; shared university/VPN IPs "might encounter rate-limiting issues earlier due to shared resources"; static file access is not restricted — [RCSB Web APIs overview](https://www.rcsb.org/docs/programmatic-access/web-apis-overview).

### Inferences
- Treat the 26.09 rename as the single biggest integration risk for an LLM-assisted hackathon build: any model answering from pre-Sept-2026 training data will emit `knownDrugs { rows { drug { ... } } }`, which now fails with an "undefined field" error rather than degrading. Pin the four working queries above into the repo and have the model edit them rather than write new ones.
- `gql-complexity` in the response header plus observed values (303 for 25 rows, 36001 for 3000 rows) gives a cheap client-side budget: no rejection was seen up to ~36k, so the practical ceiling is payload size and latency, not complexity.
- Open Targets' own docs tell you not to do what a live hackathon app does: "we discourage users from repeatedly querying the GraphQL API one entity at a time" and "For more systematic queries (e.g. for multiple targets), please use our data downloads" — [GraphQL API docs](https://platform-docs.opentargets.org/data-access/graphql-api). Batch with `targets(ensemblIds: [...])`/`drugs(chemblIds: [...])` (verified at 200 ids / 571 ms) rather than looping.

### Gaps
- **No published rate limit for the Open Targets GraphQL API.** The docs page states no rate, complexity or pagination limit; the only hard limit I could confirm empirically is page size 3000. No 429 was triggered in ~120 live calls over ~45 minutes, but that is not evidence of a high ceiling.
- **ChEMBL's official usage limits could not be found.** The ChEMBL web-services documentation page contains only pointers to the interactive docs and states nothing about rate limits, fair use, caching or the `only=` parameter — [ChEMBL web services](https://chembl.gitbook.io/chembl-interface-documentation/web-services). I ran ~40 calls with no throttling observed.
- PubChem's own policy page was unreachable (reCAPTCHA interstitial on two attempts), so the 5/s · 400/min · 300 s-per-minute figures are secondary-source only.
- `associationDatasources` returning `[]` — could not determine whether this is an intentional removal or a 26.09 bug; the release notes do not mention it.
- `Disease.associationTimeSeries` / `Target.associationTimeSeries` returned `count: 0` for every probe (COVID×TYK2/JAK1/AAK1 with `isDirect` both true and false, target-side TP53→MM). The field exists and validates but yields no data — do not build the "novelty over time" panel on it.

---

## Q2. COVID-19: is the baricitinib "known-answer check" circular, and does a non-circular version still surface it?

### Takeaway
**Yes, fully circular as planned** — Open Targets lists baricitinib directly under COVID-19 with 22 clinical reports (ACTT-2, RECOVERY, COV-BARRIER, REMAP-CAP), and the `clinical_precedence` evidence that creates that link also inflates JAK1's and JAK2's COVID association scores. A clean version is achievable and still works: zero out `clinical_precedence` (and optionally `europepmc`), rank targets on genetics/pathway evidence, then reach drugs through **ChEMBL bioactivity, not just curated mechanism of action** — at which point baricitinib ties for first among JAK-family candidates via **TYK2** (the top genetically-supported COVID target), with pre-2020 published potency so even a 2020 time cut-off holds.

### Cited Findings — proof of circularity
- `disease(efoId:"MONDO_0100096").drugAndClinicalCandidates` contains **BARICITINIB CHEMBL2105759**, `row.maxClinicalStage PHASE_3`, `drug.maximumClinicalStage APPROVAL`, targets `[JAK1, JAK2]`, **22 clinical reports** including `nct04401579` (ACTT-2, COMPLETED), `nct04381936` (RECOVERY, RECRUITING), `nct04421027` (COV-BARRIER, COMPLETED), `nct02735707` (REMAP-CAP). Verified live.
- `drug(chemblId:"CHEMBL2105759").indications` → `count 71`, including `MONDO_0100096 COVID-19 | maxClinicalStage PHASE_3` with six Phase-3 ClinicalTrials.gov reports. Verified live.
- ChEMBL independently lists it: `drug_indication` row `MONDO:0100096 | COVID-19 | max_phase_for_ind 3.0` with 17 NCT ids (NCT04320277, NCT04321993, NCT04340232, NCT04346147, NCT04358614, NCT04373044, NCT04401579, NCT04421027, …). Verified live.
- The contamination reaches the *target* scores: `COVID JAK1 = gwas_credible_sets 0.71, clinical_precedence 0.68, europepmc 0.25` → overall 0.540; `COVID JAK2 = clinical_precedence 0.68, europepmc 0.27` → 0.419. **JAK2's entire COVID association is clinical + literature; it has no genetic or pathway support.** Verified live.
- Also worth flagging as a demo-breaking data-quality issue: Open Targets records baricitinib×COVID-19 at **`PHASE_3`, not `APPROVAL`**, even though the FDA approved Olumiant for hospitalised adults with COVID-19 on 10 May 2022 — [Lilly/Incyte FDA approval announcement coverage](https://www.biospace.com/fda-approves-lilly-and-incyte-s-olumiant-baricitinib-for-the-treatment-of-certain-hospitalized-patients-with-covid-19). The 25.03 release note ("Filtered out Phase IV trial evidence that lacks regulatory approval for the specific indication") plus the absent FDA/EMA report for this indication is the likely cause. Don't claim "Open Targets knows it's approved for COVID" on stage.

### Cited Findings — non-circular design that works

**Mechanism (verified exactly):** an Open Targets overall association score is the **harmonic sum of weighted datasource scores divided by π²/6**, and each datasource score is the harmonic sum of its individual evidence scores by the same formula.
```
score = Σ_i (w_i · s_i) / i²  ÷  (π²/6),  with s sorted descending
```
- Reproduced client-side for **all 8,235 COVID rows and all 5,341 MM rows: max absolute error 0.0000, mean 0.00000.**
- Reproduced from raw evidence up to datasource level for all **1,347** COVID genetically-supported targets: **max abs error 0.0000**.
- Consequence: you can re-weight, drop datasources, or apply a date cut-off **entirely client-side from one bulk fetch**, with numbers that match the API exactly. This is the key enabler for the whole non-circular story.

**Server-side alternative, with a trap.** The `datasources: [DatasourceSettingsInput!]` argument on `associatedTargets` **replaces the entire weight table**, it does not patch it:
- Passing only `[{id:"clinical_precedence", weight:0.0, propagate:true}]` → **2817 ms**, ranks `TYK2 5, JAK1 222, JAK2 1554, AAK1 2027`, top5 `ACE2 0.791, ABO 0.698, IL6 0.691, IFNAR2 0.679, TYK2 0.676` (every other source silently promoted to weight 1.0).
- Passing the full default list **plus** `clinical_precedence: 0.0` → **2498 ms**, ranks `TYK2 2, JAK1 80, JAK2 2043, AAK1 2549`, top5 `ACE2 0.684, TYK2 0.604, TMPRSS2 0.602, GPC5 0.598, ABO 0.594` — **identical to the client-side computation**. Both verified live.

**Target ranks for the four JAK-story targets under each scheme (COVID-19, verified):**

| scheme | TYK2 | JAK1 | JAK2 | AAK1 |
|---|---|---|---|---|
| default (API overall) | **1** (0.687) | 25 (0.540) | 96 (0.419) | 2752 (0.023) |
| drop `clinical` | **2** (0.604) | 80 (0.441) | 2043 (0.032) | 2549 (0.023) |
| drop `clinical` + `literature` | **4** (0.586) | 81 (0.433) | absent | absent |
| genetics only (`gwas_credible_sets` + `gene_burden`) | **1** (0.586) | 31 (0.433) | absent | absent |
| genetics only, evidence published ≤ 2020-12-31 | **5** | absent | absent | absent |

**Drug-level, non-circular:** take the top-100 targets under "drop clinical", fan out with `targets(ensemblIds:[...]).drugAndClinicalCandidates`, de-duplicate on `drug.parentMolecule.id`, score each drug as (best target score, sum of target scores).
- 60 distinct parent drugs reached, 24 approved somewhere. Ranking: `1 DELGOCITINIB, 2 FILGOTINIB, 3 RUXOLITINIB, 4 TOFACITINIB, 5 UPADACITINIB, 6 CRAVACITINIB (parent of deucravacitinib)` — all at 0.604 via TYK2 — then 7–17 the interferons via IFNAR2 (0.563), **22 BARICITINIB (0.441, via JAK1 only)**. Verified live.
- **Why baricitinib under-ranks: Open Targets' curated mechanism of action for baricitinib is only `JAK1` + `JAK2`** (sourced from PubMed 20363976), so it never touches TYK2, the top genetic target. Verified live.
- **The fix that recovers it — augment drug→target edges with ChEMBL bioactivity.** Taking human targets with median pChEMBL ≥ 7 from `/activity.json`, baricitinib gains `AAK1, BMP2K, SEPTIN9, STAT3, TYK2` on top of JAK1/JAK2. Re-ranking the nine JAK-family approved drugs on the same no-clinical target scores:
  - MoA only: `TOFACITINIB (0.60/1.04) = RUXOLITINIB = UPADACITINIB = FILGOTINIB = DELGOCITINIB > DEUCRAVACITINIB (0.60/0.60) > BARICITINIB (0.44/0.44) = ABROCITINIB = MOMELOTINIB`
  - MoA + potent bioactivity: **`BARICITINIB (0.60/1.04)` joint first** with tofacitinib, ruxolitinib, upadacitinib, filgotinib, delgocitinib, momelotinib. Verified live.
- **Time cut-off is also safe.** Baricitinib's TYK2 potency is published well before COVID: `IC50 61 nM / pChEMBL 7.21` in a 2014 document (`CHEMBL3297690`), `53 nM / 7.28` 2015, `8.7 nM / 8.06` 2016. Its AAK1 affinity `Kd 8.2 nM / pChEMBL 8.09` first appears in a 2017 document (`CHEMBL3991601`, `Kd 46 nM / 7.34`). Verified live.
- **Genetics as of 31 Dec 2020** (evidence dated via `credibleSet.study.publicationDate`): 122 targets, top 10 `ABO, IFNAR2, OAS1, IL10RB, TYK2, SLC6A20, DPP9, OAS3, LZTFL1, FYCO1`; **TYK2 is #5**, JAK1 absent (JAK1's genetic evidence comes only from PMID 37198478 (2023) and PMID 39361370 (2024)). Earliest COVID genetic evidence in the Platform is dated **2020-05-13** (COVID-19 Host Genetics Initiative, PMID 32404885). Verified live.
- The underlying science backs the clean narrative: "on chromosome 19p13.2 (rs74956615, P = 2.3 × 10⁻⁸) near the gene that encodes tyrosine kinase 2 (TYK2)… We identified potential targets for repurposing of licensed medications: using Mendelian randomization, we found evidence that low expression of IFNAR2, or high expression of TYK2, are associated with life-threatening disease… Both mechanisms may be amenable to targeted treatment with existing drugs" — Pairo-Castineira et al., *Nature*, first published 2020-12-11, [PMID 33307546](https://doi.org/10.1038/s41586-020-03065-y).
- And the outcome to show as the "answer": "Overall, 514 (12%) of 4148 patients allocated to baricitinib versus 546 (14%) of 4008 patients allocated to usual care died within 28 days (age-adjusted rate ratio 0·87; 95% CI 0·77–0·99; p=0·028)… The total randomised evidence to date suggests that JAK inhibitors (chiefly baricitinib) reduce mortality in patients hospitalised for COVID-19 by about one-fifth" — RECOVERY Collaborative Group, *Lancet*, 2022, [PMID 35908569](https://doi.org/10.1016/s0140-6736(22)01109-6).
- Evidence-provenance query for the "why this target" panel:
```graphql
query GeneticEvidence($id: String!, $t: [String!]!) {
  disease(efoId: $id) {
    evidences(ensemblIds: $t, datasourceIds: ["gwas_credible_sets","gene_burden"], size: 50) {
      count rows { datasourceId score studyId
        credibleSet { study { id traitFromSource publicationFirstAuthor publicationDate pubmedId nCases } } } } } }
```
→ TYK2 ×COVID: **30 rows in 182 ms**, top scores 0.99 from `GCST90104030` (Kousathanas A, 2022-03-07, PMID 35255492, "COVID-19 critical illness vs population or mild symptoms", nCases 5989), `GCST90270934` (Pairo-Castineira, 2023, nCases 24202), `GCST90454507` (Diz-de Almeida, 2024, nCases 4702). JAK1 ×COVID: only **3 rows**, all score 0.86, all 2023–2024.

### Inferences
- **Recommended demo framing:** run COVID-19 twice. Pass 1 "with clinical evidence" shows baricitinib already sitting there — explicitly labelled as the circular/leaky view. Pass 2 "evidence-only mode" (clinical weight 0, drug→target edges from ChEMBL bioactivity, optional 2020 cut-off) rediscovers it through TYK2/JAK1. The contrast *is* the demo; a model jury that agrees in pass 1 and argues in pass 2 is a far better story than a single ranked list.
- AAK1 — the BenevolentAI endocytosis hypothesis behind the original baricitinib-for-COVID proposal ("Baricitinib as potential treatment for 2019-nCoV acute respiratory disease", Richardson et al., *Lancet*, 2020-02-04, [PMID 32032529](https://doi.org/10.1016/s0140-6736(20)30304-4)) — scores **0.023, rank 2752** in Open Targets (literature only, 36 europepmc rows, peaking at 13 in 2020) and has **zero** `drugAndClinicalCandidates` rows. If you want that part of the story you must pull it from ChEMBL bioactivity; Open Targets alone will not surface it. Verified live.
- A pure "exclude the disease's own drugs" filter is **not** sufficient: it removes the drug but leaves `clinical_precedence` in the target score, which is the real leak. Zeroing the datasource is the correct cut.

### Gaps
- I did not rebuild a full as-of-2020 *drug* ranking (it would need a date-filtered rebuild of literature and pathway evidence too, and ChEMBL has no clean API-side document-date filter on mechanisms). The 2020 claim is verified at target level and at ChEMBL-activity-document-year level only.
- `europepmc` evidence rows expose `publicationYear` but Open Targets does not expose a server-side date filter on `evidences`, so a literature cut-off must be done client-side after fetching all rows (COVID JAK1 = 212 rows, ~950 ms).

---

## Q3. Multiple myeloma: which targets and drugs come back, and what makes a good demo?

### Takeaway
Default Open Targets MM output is **even more circular than COVID** — 6 of the top 25 targets are proteasome subunits whose association is ~99% `clinical_precedence`. With clinical evidence removed the ranking becomes a genuine cancer-genomics list (TP53, KRAS, NRAS, FGFR3, BRAF, IRF4, CCND1), and the two standout non-circular demo candidates are **venetoclax via BCL2** (survives even after also dropping literature *and* the leaky `cancer_biomarkers` channel) and **erdafitinib via FGFR3** (rank 4, t(4;14) biology, small molecule, dockable).

### Cited Findings
- `MONDO_0009693` default top 25 (verified, 168 ms): `CRBN 0.708, TNFRSF17 0.680, TP53 0.670, LIG4 0.662, KRAS 0.661, CXCR4 0.659, FGFR3 0.645, NRAS 0.642, XPO1 0.642, CD38 0.627, NR3C1 0.622, RBX1 0.621, PSMB8 0.618, PSMA3 0.617, PSMA4 0.616, HDAC4 0.614, CUL4A 0.613, ADRM1 0.611, PSMD4 0.609, PSMD14 0.609, PSMB9 0.608, PSMB5 0.608, PSMB4 0.608, PSMB6 0.607, DDB1 0.607`.
- Circularity made explicit (verified datasource breakdowns): `PSMB5 = clinical_precedence 0.99 + europepmc 0.15 + expression_atlas 0.03`; `CD38 = clinical_precedence 0.98 + europepmc 0.96`; `XPO1 = clinical_precedence 0.93 + cancer_gene_census 0.46 + europepmc 0.39`; `CRBN = clinical_precedence 0.99 + cancer_biomarkers 0.91 + europepmc 0.85 + eva_somatic 0.43`.
- **38 drug records at `APPROVAL`** in `disease.drugAndClinicalCandidates` (verified): bortezomib, bortezomib D-mannitol, carfilzomib, ixazomib, ixazomib citrate, lenalidomide, pomalidomide, thalidomide, daratumumab, isatuximab, elotuzumab, belantamab mafodotin, teclistamab, talquetamab, elranatamab, linvoseltamab, ciltacabtagene autoleucel, idecabtagene vicleucel, selinexor, panobinostat (+ lactate), melphalan, melphalan flufenamide (+ HCl), (R)-melphalan at Phase 3, carmustine, cyclophosphamide, doxorubicin (+ HCl), vincristine sulfate, dexamethasone, denosumab, zoledronic acid, plerixafor, motixafortide (+ acetate), sirolimus, interferon alfa-2b, hyaluronidase.
- Target ranks under each de-circularising scheme (verified):

| target | default | drop `clinical` | drop `clinical`+`literature` | drop `clinical`+`cancer_biomarkers` | genetics only |
|---|---|---|---|---|---|
| CRBN | 1 | 52 | 71 | 182 | absent |
| TNFRSF17 | 2 | 105 | 464 | 103 | absent |
| FGFR3 | 7 | **5** | **5** | **5** | absent |
| XPO1 | 9 | 157 | 156 | 156 | absent |
| CD38 | 10 | 771 | absent | 771 | absent |
| PSMB5 | 22 | 1858 | 1472 | 1858 | absent |
| BRAF | 54 | **6** | **6** | **6** | absent |
| BCL2 | 98 | 41 | 45 | 54 | absent |
| TNFRSF13B | — | **7** | **7** | **7** | **1** |

- "Drop clinical" top 15 for MM (verified): `TP53 0.67, LIG4 0.66, KRAS 0.66, NRAS 0.64, FGFR3 0.64, BRAF 0.60, TNFRSF13B 0.58, IRF4 0.56, CDKN2A 0.55, TENT5C 0.54, CCND1 0.54, MAX 0.51, CDCA7L 0.50, CYLD 0.50, POT1 0.46`.
- **Genetics-only MM is near-useless**: only **149 targets** have any `gwas_credible_sets`/`gene_burden` evidence, topped by `TNFRSF13B 0.56, CDCA7L 0.49, CDKN2A 0.47, KLF2 0.45`; CRBN, FGFR3, BCL2, XPO1, CD38 and PSMB5 are all absent. Verified live. For cancers, "genetics only" must mean genetics **+ somatic_mutation**, not germline alone.
- Approved drugs reached via top-100 "drop clinical" targets (verified): 275 distinct parent drugs, **91 approved**. Top 25: `1 ADAGRASIB, 2 SOTORASIB (KRAS 0.660); 3 E-7090, 4 ERDAFITINIB, 5 FUTIBATINIB, 6 INFIGRATINIB, 7 MASITINIB, 8 NINTEDANIB, 9 PAZOPANIB, 10 PEMIGATINIB (FGFR3 0.637); 11 SORAFENIB, 12 DABRAFENIB, 13 ENCORAFENIB, 14 REGORAFENIB, 15 TOVORAFENIB, 16 VEMURAFENIB (BRAF 0.598); 17 PALBOCICLIB (CCND1 0.535); 18 ATALUREN; 19 NAVITOCLAX, 20 OBLIMERSEN, 21 VENETOCLAX (BCL2 0.370); 22 PACRITINIB; 23 AZACITIDINE, 24 DECITABINE (DNMT3A); 25 LENALIDOMIDE (CRBN 0.352)`.
- **`cancer_biomarkers` is a second leak channel for oncology** — it names the drug inside the evidence row. Verified: MM×BCL2 `cancer_biomarkers` rows are `biomarker "BCL2 overexpression", drug BORTEZOMIB` and `drug VENETOCLAX`, confidence "Early trials"; MM×CRBN rows are `CRBN oncogenic mutation / LENALIDOMIDE / drug resistance`; MM×FGFR3 rows are `FGFR3 (K650,Y373C) / Fgfr Inhibitors`. For a strict known-answer test, drop `cancer_biomarkers` as well as `clinical_precedence`.
- **Venetoclax survives the strictest cut**: with `clinical_precedence`, `cancer_biomarkers` *and* `europepmc` all dropped, BCL2 is still rank 55 and venetoclax ranks **24 of 88** approved drugs reached, `tested_in_MM = True`. Under the milder "drop clinical" cut it is 21/91. Verified live. BCL2's residual MM support is `cancer_gene_census 0.46 + gwas_credible_sets 0.40 + impc 0.39`.
- Under the strict cut, lenalidomide, pomalidomide, thalidomide, bortezomib, selinexor and daratumumab are **no longer reachable** via the top-100 targets — their targets collapse out of the ranking. Verified live. That is the honest, demonstrable point about how much of "what we know about myeloma drugs" is just "we gave these drugs to myeloma patients".
- **Approval-provenance trap, quantified.** Of the drug records with `maximumClinicalStage: APPROVAL` reached from top-100 no-clinical targets: COVID **30 total, 25 with an FDA/EMA/PMDA/DailyMed report, 5 weak**; MM **110 total, 83 regulator-backed, 27 weak**. Weak examples (approval asserted only by ATC or TTD, or no approval report at all): `NAVITOCLAX (ATC, indication "neoplasm")`, `OBLIMERSEN (ATC)`, `MASITINIB (ATC)`, `ATALUREN (no approval report)`, `INFIGRATINIB (ATC, TTD)`, `LESTAURTINIB (TTD)`, `METHANDROSTENOLONE`, `CYPROTERONE ACETATE`. Verified live. **Navitoclax has never been approved** — filter on regulator sources or you will put a non-drug in front of judges.

### Inferences
- Best MM demo pair: **erdafitinib → FGFR3** as the "new idea" (rank 4, FGFR3 is the t(4;14) translocation partner, approved small molecule, 51 PDB structures available for the FGFR3 kinase domain) and **venetoclax → BCL2** as the non-circular known answer (t(11;14) myeloma, real Phase 3 programme in BELLINI, and a 1.62 Å co-crystal to dock into). Both are small molecules, which matters: most of MM's actual top drugs are antibodies, ADCs and CAR-Ts that cannot be docked at all.
- Avoid daratumumab/teclistamab/cilta-cel as the "pick a drug to dock" step — PubChem returns 404 for antibodies and RCSB has no SLAMF7 ligand-bound structure. Gate the docking button on `drugType == "Small molecule"` plus a resolvable PubChem CID.
- The proteasome block (PSMB4/5/6/8/9, PSMA1-5, PSMD4/14, ADRM1) is 10+ near-identical rows at ~0.61 that are really one drug class. Collapse by mechanism-of-action string before showing a target list, or the UI looks broken.

### Gaps
- I did not test an MM time cut-off (MM's evidence is dominated by non-dated sources like `cancer_gene_census` and `intogen`, so a date-based holdout is much weaker than for COVID).
- `TENT5C`, `CDCA7L`, `MAX`, `POT1` appear high in the no-clinical ranking but I did not check whether any approved drug reaches them.

---

## Q4. How should candidates be scored and de-duplicated, and which fields explain best to students?

### Takeaway
Score drugs as an aggregate over the evidence-only target scores they touch, de-duplicate on `drug.parentMolecule.id` (salts and hydrates are separate ChEMBL records and will otherwise flood your top 10), and build explanations from four fields that are human-readable out of the box: `mechanismsOfAction.rows.mechanismOfAction`, `ClinicalReport.title`/`trialSponsor`, `datatypeScores`, and a ChEMBL median pChEMBL.

### Cited Findings — de-duplication, all verified live
- **Salts/hydrates are separate records sharing a parent.** `JAK1.drugAndClinicalCandidates` contains both `RUXOLITINIB (CHEMBL1789941)` and `RUXOLITINIB PHOSPHATE (CHEMBL1795071, parentMolecule RUXOLITINIB)`, both `TOFACITINIB` and `TOFACITINIB CITRATE`, both `UPADACITINIB` and `UPADACITINIB HEMIHYDRATE`, both `FILGOTINIB` and `FILGOTINIB MALEATE`, both `MOMELOTINIB` and `MOMELOTINIB DIHYDROCHLORIDE MONOHYDRATE`. MM has `BORTEZOMIB` + `BORTEZOMIB D-MANNITOL`, `IXAZOMIB` + `IXAZOMIB CITRATE`, `PANOBINOSTAT` + `PANOBINOSTAT LACTATE`, `MELPHALAN` + `(R)-MELPHALAN` + `MELPHALAN FLUFENAMIDE` + `MELPHALAN FLUFENAMIDE HYDROCHLORIDE`, `MOTIXAFORTIDE` + `MOTIXAFORTIDE ACETATE`. Collapsing on `parentMolecule.id ?? id` cut the COVID top-100 fan-out from raw rows to **60 distinct parents**.
- **One parent-molecule edge is wrong**: `DEURUXOLITINIB PHOSPHATE (CHEMBL4594382)` has `parentMolecule: RUXOLITINIB`, which merges a distinct deuterated drug into ruxolitinib. Verified live. If a judge knows the field, that's a visible error — consider special-casing or showing both names.
- **`search`/`mapIds` return `MONDO_0100096` style IDs with underscores; ChEMBL and the `dbXRefs` field use `MONDO:0100096` with a colon.** Verified in both directions. Normalise before joining ChEMBL `drug_indication.efo_id` to Open Targets disease IDs.
- Mixed-ontology disease IDs are the norm: ChEMBL's baricitinib indications span `EFO:*`, `MONDO:*` and `HP:*` (e.g. `HP:0100806 Sepsis`). Don't assume EFO.

### Cited Findings — scoring recipe (all components verified)
1. Fetch all `associatedTargets` rows once (COVID 3 pages / 6.1 s; MM 2 pages / 4.1 s) with `datasourceScores`.
2. Recompute the overall score with chosen weights using `Σ (w·s)/i² ÷ (π²/6)` — **exact to 0.0000 against the API**.
3. Keep the top-K (K=100 worked well; 60 parent drugs for COVID, 275 for MM).
4. Fan out with `targets(ensemblIds: [...25 at a time])` → ~91–209 ms per chunk.
5. Optionally add ChEMBL bioactivity edges: `/activity.json?molecule_chembl_id=X&pchembl_value__gte=5&target_organism=Homo%20sapiens&limit=1000&only=target_chembl_id,pchembl_value` (217–2362 ms per drug), map ChEMBL target → gene symbol via `/target.json?target_chembl_id__in=...` reading `target_components[].target_component_synonyms[] where syn_type == "GENE_SYMBOL"`, keep median pChEMBL ≥ 7. **This step is what rescues baricitinib** (see Q2).
6. Aggregate per drug: `best = max(target_score)`, `breadth = Σ target_score`. Sort by `(best, breadth)`. Verified to produce sensible, explainable orderings on both diseases.
7. Filter: `drug.maximumClinicalStage == "APPROVAL"` **AND** at least one `clinicalReports.source ∈ {FDA, EMA Human Drugs, PMDA, DailyMed}` (removes navitoclax/oblimersen/masitinib-class false positives — 5/30 COVID, 27/110 MM).

### Cited Findings — fields that explain well to students
- `mechanismsOfAction.rows.mechanismOfAction` is already a plain-English sentence: `"Tyrosine-protein kinase JAK1 inhibitor"`, `"CRL4(CRBN) E3 ubiquitin ligase modulator"`, `"26S proteasome inhibitor"`, `"Exportin-1 inhibitor"`, `"Lymphocyte differentiation antigen CD38 inhibitor"`. Paired with `actionType` (`INHIBITOR`) and `references{source ids urls}` (PubMed + europepmc links). Verified live.
- `Drug.description` is an auto-generated one-liner: *"Small molecule drug with a maximum clinical stage of Approval (across all indications), with 9 approved and 66 investigational indications."* Verified live for baricitinib.
- `datatypeScores` gives a ready-made 6-bar "why this target" chart with self-describing labels (`genetic_association`, `literature`, `clinical`, `somatic_mutation`, `affected_pathway`, `animal_model`, `rna_expression`, `genetic_literature`).
- `ClinicalReport` → `title`, `trialSponsor.name`/`agencyClass`, `trialOverallStatus`, `trialStartDate`, `trialPrimaryPurpose`, `trialWhyStopped`, `trialStopReasonCategories`, `url` (a real clinicaltrials.gov link), `trialLiterature` (PMIDs). Verified live on ACTT-2.
- GWAS provenance for the genetics bar: `credibleSet.study.{traitFromSource, publicationFirstAuthor, publicationDate, pubmedId, nCases}` — e.g. *"COVID-19 (critical illness vs population), Pairo-Castineira E, 2023-05-17, PMID 37198478, 24,202 cases"*. Verified live.
- ChEMBL per-target potency sentence: median/max pChEMBL + assay count, e.g. *"baricitinib inhibits JAK1 with median pChEMBL 8.23 across 26 human assays (best 9.15)"*. Verified live.
- Safety one-liners: `drugWarnings.toxicityClass` + `warningType` (`"Black Box Warning: vascular toxicity (US)"`), and `adverseEvents.rows.name` with `count`/`logLR` against `criticalValue`.

### Inferences
- Because the scoring formula is reproducible exactly, the **model jury should be fed the evidence table, not the score** — each LLM sees the same `{target, datatypeScores, mechanismOfAction, pChEMBL, trial titles}` rows and produces its own ranking, with the deterministic harmonic score shown as a fourth "juror". Disagreement between the deterministic score and the LLMs is a much better visual than LLM-vs-LLM alone.
- Keep a `leak_flags` field per candidate (`reached_via_clinical`, `named_in_cancer_biomarkers`, `already_indicated_for_disease`) and surface it in the UI. It converts the project's main scientific weakness into a feature and is exactly the kind of rigour that wins judged prizes.

### Gaps
- I did not benchmark any alternative aggregation (e.g. max vs harmonic over targets per drug) against a held-out truth set; the `(best, breadth)` recommendation is reasoned, not validated.

---

## Q5. Bulk alternatives: Parquet, SQL dumps, Snowflake, BigQuery — when do they beat live APIs?

### Takeaway
For a 24-hour build the live APIs are fast enough for everything except whole-disease sweeps; the one download genuinely worth doing is the **~127 MB of Open Targets 26.09 drug/clinical Parquet + a disease/target lookup**, which turns every "all drugs for this disease" call into a local join. The 2.3–2.6 GB association files and the 5.4 GB ChEMBL SQLite dump are almost certainly not worth the hackathon clock.

### Cited Findings — Open Targets bulk (all sizes measured live from the EBI FTP listing, 26.09)
- Three mirrors, from the Croissant metadata in `meta.downloads` (verified live: `name "Open Targets Platform Datasets", version 26.09, datePublished 2026-09-18, license CC0, 64 distributions, 61 recordSets`):
  - `http://ftp.ebi.ac.uk/pub/databases/opentargets/platform/26.09/output/`
  - `gs://open-targets-data-releases/26.09/output/`
  - `s3://open-targets-public-data-releases/platform/26.09/output/`
- **Anonymous S3 listing works with no credentials**: `GET https://open-targets-public-data-releases.s3.amazonaws.com/?list-type=2&prefix=platform/26.09/output/clinical_indication/` → **140 ms**, `platform/26.09/output/clinical_indication/00000000.parquet, 4,989,955 bytes`. Verified live.
- Measured dataset sizes (26.09, Parquet):

| dataset | files | size |
|---|---|---|
| `drug_mechanism_of_action` | 1 | **0.3 MB** |
| `drug_warning` | 1 | **0.2 MB** |
| `clinical_target` | 1 | **2.7 MB** |
| `clinical_indication` | 1 | **4.8 MB** |
| `disease` | 1 | **6.1 MB** |
| `drug_molecule` | 1 | **6.5 MB** |
| `target` | 3 | **20.6 MB** |
| `evidence_clinical_precedence` | 1 | **38 MB** |
| `clinical_report` | 1 | **72 MB** |
| `evidence_gwas_credible_sets` | 3 | **196 MB** |
| `association_overall_indirect` | 39 | **~2.3 GB** |
| `association_by_datatype_indirect` | 41 | **~2.58 GB** |

- 61 recordSets are available; the drug-relevant ones are `clinical_indication`, `clinical_report`, `clinical_target`, `drug_molecule`, `drug_mechanism_of_action`, `drug_warning`, `openfda_significant_adverse_drug_reactions`, plus `evidence_*` per source. Verified from the Croissant JSON-LD and the FTP directory listing.
- Release cadence from the FTP listing (verified): `25.03, 25.06, 25.09, 25.12, 26.03, 26.06, 26.09` plus a `latest/` alias; `26.09/` timestamped 2026-09-24.
- 26.09 applied "Large Arrow types and zstd compression… cutting sizes by 20-45%" — [release notes](https://platform-docs.opentargets.org/release-notes).
- BigQuery: project `open-targets-prod`, dataset `platform`, sample tables `association_overall_direct`, `disease`, `target`, `drug_molecule`; "Users only pay for the queries they perform on the data" and "the first 1 TB per month is free" — [Open Targets BigQuery docs](https://platform-docs.opentargets.org/data-access/google-bigquery).

### Cited Findings — ChEMBL bulk (sizes from the live EBI listing, 2026-05-29)
`https://ftp.ebi.ac.uk/pub/databases/chembl/ChEMBLdb/latest/`: `chembl_37_sqlite.tar.gz` **5.4 GB**, `chembl_37_postgresql.tar.gz` **1.9 GB**, `chembl_37_mysql.tar.gz` **2.0 GB**, `chembl_37_chemreps.txt.gz` **279 MB** (id↔SMILES↔InChI only), `chembl_37.sdf.gz` **888 MB**, `chembl_37.fps.gz` **168 MB** (fingerprints), `chembl_37.h5` **314 MB**, `chembl_uniprot_mapping.txt` **1.2 MB**, plus `chembl_37_release_notes.txt`, `schema_documentation.html/.txt` and `chembl_37_schema.pdf`. Verified live.

### Inferences
- **Do download** (total ≈ 127 MB, a couple of minutes): `drug_molecule`, `drug_mechanism_of_action`, `drug_warning`, `clinical_indication`, `clinical_target`, `clinical_report`, `disease`, `target`. These replace the two slowest/heaviest live calls (`disease.drugAndClinicalCandidates` at 1.0–2.9 MB per disease, and the per-target fan-out) with sub-millisecond local joins, and make the whole app demo-able offline if the venue wifi dies — a real risk worth insuring against for a live judged demo.
- **Do download** `chembl_uniprot_mapping.txt` (1.2 MB): it removes an entire category of live ChEMBL target-resolution calls and the `SINGLE PROTEIN` filtering trap.
- **Don't download** the association Parquet (2.3–2.6 GB): one 3000-row API page costs 1.5–2.7 s and a full disease is ≤ 6.1 s, which is fine for a user-initiated search. Same for the 5.4 GB ChEMBL SQLite — per-molecule REST calls run at 100–400 ms.
- DuckDB reading Parquet straight from the S3/HTTP URL is the lowest-friction path, and it loads cleanly into Tiger Cloud Postgres for the experiment-history requirement.

### Gaps
- **Snowflake Marketplace: could not verify any ChEMBL or Open Targets listing.** Web search returned only generic Marketplace documentation and no listing page; the Marketplace catalogue is not reachable without an authenticated Snowflake session — [Snowflake Marketplace docs](https://docs.snowflake.com/en/en/user-guide/data-marketplace). Treat "the data is on Snowflake Marketplace" as unconfirmed; the safe plan for the Snowflake sponsor prize is to **load the Parquet/CSV into Snowflake yourself** and use Cortex on top of it, which also makes a better story than consuming a listing.
- **BigQuery currency unverified.** The docs page's console link references `platform_21_06`, and the page never states which release is loaded or whether it is still refreshed. Do not assume BigQuery has 26.09.
- A ChEMBL BigQuery public dataset (`patents-public-data.ebi_chembl`) is described only in a 2020 third-party tutorial — [Towards Data Science](https://v2.towardsdatascience.com/using-google-bigquery-to-analyze-data-from-the-ebi-small-molecules-database-2dcabdc73bc9) — with no official listing found. Unverified and probably stale.

---

## Q6. Which PDB entries make good docking demo structures?

### Takeaway
For the COVID story the single best entry is **6WTO (JAK2 JH1 + baricitinib, 1.74 Å, 309 residues, ligand `3JW`)** — small, clean, one chain, one drug ligand, and the bound pose is downloadable for an RMSD check. **There is no JAK1+baricitinib, TYK2+baricitinib or AAK1+baricitinib structure in the PDB** (verified: HTTP 204 on all three). For myeloma, **6O0K (BCL2 + venetoclax, 1.62 Å, 166 residues)** is the best demo structure in either disease, and **9FJX (CRBN–DDB1 + lenalidomide, 2.0 Å)** / **7BQU (CRBN + SALL4 + S-thalidomide, 1.9 Å, only 142 residues)** cover the molecular-glue story.

### Cited Findings — all entries verified live via RCSB Search + Data GraphQL

**COVID / JAK family**

| PDB | res (Å) | released | ligand | entities / residues | note |
|---|---|---|---|---|---|
| **6WTO** | **1.74** | 2021-05-05 | `3JW` (baricitinib) | 1 / 309 | "Human JAK2 JH1 domain in complex with Baricitinib". **Best baricitinib demo.** |
| 6VN8 | 1.9 | 2021-02-17 | `3JW` | 1 / 616 | "JAK2 JH1 in complex with baricitinib" |
| 3EYG | 1.9 | 2009-02-03 | `MI1` (tofacitinib) | 1 / 290 | Only JAK1 + approved JAK-inhibitor complex found (P23458) |
| 6WTN | 1.83 | 2021-05-05 | `RXT` (ruxolitinib) | 1 / 309 | JAK2 JH1 — ideal cross-docking control vs 6WTO |
| 9T1U | 1.65 | 2026-07-29 | `RXT` | 1 / 316 | JAK2 + ruxolitinib, phosphorylated activation loop (brand new) |
| 8BXH | **1.3** | 2023-12-20 | `C87` (momelotinib) | 1 / 316 | Highest-resolution JAK2 JH1 complex |
| 5UT5 | 1.9 | 2017-06-07 | `2HB` (filgotinib) | 1 / 289 | JAK2 **JH2** pseudokinase domain |
| 6NZQ | 2.11 | — | `LB4` | 1 / 634 | TYK2 JH2 + BMS-986165 (deucravacitinib) series |
| 5TE0 | 1.9 | 2016-11-02 | `XIN` | 1 / 347 | Best AAK1 structure (no baricitinib complex exists) |

- Negative results, verified (all HTTP 204 / zero hits): JAK1+`3JW`, TYK2+`3JW`, AAK1+`3JW`, TYK2 + full-text "deucravacitinib" (use "BMS-986165" instead, 3 hits), JAK1 + full-text "baricitinib".
- Ligand `3JW` resolves cleanly: `chem_comps(comp_ids:["3JW"])` → name "Baricitinib", formula `C16 H17 N7 O2 S`, xrefs `DrugBank DB11817`, `ChEMBL CHEMBL2105759`. Verified live.

**Multiple myeloma**

| PDB | res (Å) | ligand | entities / residues | note |
|---|---|---|---|---|
| **6O0K** | **1.62** | `LBM` (venetoclax) | 1 / 166 | "crystal structure of BCL-2 with venetoclax". **Best docking demo in the whole set.** |
| 6O0M / 6O0P / 6O0L | 1.75 / 1.8 / 2.2 | `LBM` | 1 / 166–332 | BCL-2 **F104L / G101A / G101V resistance mutants** + venetoclax — a ready-made "why resistance matters" panel |
| **9FJX** | 2.0 | `LVY` (lenalidomide) | 2 / 1555 | "Crystal structure of human CRBN-DDB1 in complex with Lenalidomide" (2025-01-29) |
| 8OIZ | 2.5 | `Y70` (pomalidomide) | 2 / 1555 | CRBN–DDB1 + pomalidomide |
| **7BQU / 7BQV** | 1.9 / 1.8 | `EF2` (S-thalidomide) / `F4U` | 2 / 142–133 | CRBN + SALL4 neosubstrate — **tiny, fastest to dock**, and shows the glue mechanism |
| 5FQD | 2.45 | `LVY` | 3 / 3246 | CRBN–DDB1–CK1α + lenalidomide (full ternary glue complex) |
| 4CI2 / 4CI3 | 2.95 / 3.5 | `LVY` / `Y70` | 2 / 1627 | Original DDB1–CRBN lenalidomide/pomalidomide structures |
| 5LF3 | 2.1 | `BO2` (bortezomib) | **14** / 6458 | Human 20S proteasome + bortezomib |
| 5LF7 | 2.0 | `6V8` (ixazomib) | **14** / 6458 | Human 20S + ixazomib |
| 4R67 | 2.89 | `3BV` (carfilzomib adduct) | **14** / 12572 | Human constitutive 20S + carfilzomib |
| 9OGD | 2.49 (cryo-EM) | `V6A` ("selinexor, bound form") | 4 / 1562 | XPO1 + selinexor; also 9OGA 3.37, 9OGB 3.25 |

- Proteasome caveat (verified): every 20S entry has **14 polymer entities and 6,458–12,572 residues**. Docking into the β5 (PSMB5) site requires cropping to the right chain and defining the box manually — not a 5-minute demo path. Prefer BCL2 or CRBN.
- Covalent caveat (verified): bortezomib (`BO2`), ixazomib (`6V8`), carfilzomib (`3BV`) and selinexor (`V6A`) are deposited as **covalent adducts** to the catalytic residue. Both DiffDock and Vina treat them as non-covalent ligands; the redocked pose will not be chemically meaningful. Say so, or pick non-covalent pairs.
- Ligand-ID mapping caveat (verified): PDB chemical components for the IMiDs are the **single enantiomers** (`LVY` = S-lenalidomide, `Y70` = S-pomalidomide, `EF2` = S-thalidomide, `6EL` = R-thalidomide) and cross-reference to enantiomer ChEMBL IDs (`CHEMBL2093113`, `CHEMBL426123`, `CHEMBL558551`) — **not** the racemic drug records `CHEMBL848` / `CHEMBL43452` / `CHEMBL468` your pipeline will be carrying. This is exactly why the ChEMBL-xref search returns 204 for them.
- Recommended docking fetch triple (all verified): topology `https://files.rcsb.org/download/6WTO.cif` (507,911 B, 370 ms), reference pose `https://models.rcsb.org/v1/6WTO/ligand?label_comp_id=3JW&encoding=sdf` (3,160 B, 691 ms), idealised ligand `https://files.rcsb.org/ligands/download/3JW_ideal.sdf` (3,059 B, 367 ms).

### Inferences
- **Suggested demo pairs, ordered by how likely they are to work first time on CPU:** (1) BCL2 6O0K + venetoclax — 166 residues, non-covalent, 1.62 Å; (2) JAK2 6WTO + baricitinib — 309 residues, non-covalent, 1.74 Å, and the headline narrative; (3) CRBN 7BQU + thalidomide — 142 residues; (4) JAK2 6WTN + ruxolitinib as a cross-docking control. Avoid 20S proteasome and XPO1 for the on-demand path.
- A redocking RMSD against the ModelServer pose is cheap to compute and is the most credible single number you can put on a slide — it converts "we ran a docking model" into "our pipeline recovers the crystallographic pose to X Å".
- Since `3EYG` (JAK1+tofacitinib) is the only JAK1 complex with an approved drug, if the demo insists on JAK1 you must cross-dock baricitinib into a tofacitinib-shaped pocket. Mention it rather than hide it — it is a genuine, interesting limitation.

### Gaps
- I did not run DiffDock or AutoDock Vina, so no runtime, GPU-memory or pose-quality numbers are verified here. The structure sizes above (142–12,572 residues) are the inputs you need to estimate them.
- No PDB-REDO / protonation / receptor-preparation step was tested; all entries above are raw deposited coordinates and will need waters/alt-locs stripped.
