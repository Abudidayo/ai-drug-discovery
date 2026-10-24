# Stream A sample contracts

One illustrative Experiment for the Disease **plasma cell myeloma**
(`MONDO_0009693`). These small files let Streams A, B and C build together.

| File | Deliverable that produces it | Who uses it | Plan section |
| --- | --- | --- | --- |
| `disease_targets.json` | A1: Disease resolution and evidence-only Targets | Zaid / Stream B | §3, §4.3 |
| `drug_targets.json` | A2: approved Candidate universe and Target mapping | Stream B, Worker 4 | §3, §4.2 |
| `string_id_map.json` | A3: STRING protein → Target mapping | Stream B | §3, §4.1 |
| `candidates.json` | Candidate result, assembled by Stream B | Abudi / Stream C, Worker 4 | §9.2 |
| `evidence_packet.json` | A4: blinded evidence packet | Worker 5, Stream C | §5, §6.3 |
| `jury_result.json` | A5: Model jury validation and consensus | Stream C, Stream B Experiment B | §5, §6.2 |

**IDs and source text are real; every score, rank, distance, z-score,
pChEMBL, activity count and latency is fictional.** They are examples, not
research results. Coverage counts and jury summaries are calculated exactly
from these rows. IDs, release versions and configuration settings are not
measurements. The six Disease Target rows are a small sample, not the actual
top 50; direct-evidence ranks illustrate a larger eligible universe.

Stream B owns `network`, `direct_evidence_rank`, `selected_by` and
`unscorable_reason`. Their fixture values are fictional assignments, not
computed from the other files. In particular, BCL2 is deliberately absent
from the fictional network despite having a verified STRING mapping; this
lets venetoclax exercise the evidence-only, `not_scorable` path.

Use the ID and mapping rules in [plan §3](../plan.md#identifiers): current
Open Targets Disease IDs with underscores, ENSG Target IDs, ChEMBL parent
Candidate IDs, Experiment UUIDs, Experiment-local `E#` evidence IDs, packet-local
`C#` labels and `source-version` releases. STRING `9606.ENSP…` IDs are lookup
columns only. Names and symbols are display text; never join on them.

Salts are merged into their verified parents. Ruxolitinib includes its
phosphate `CHEMBL1795071`; exclude the erroneous deuruxolitinib links
`CHEMBL4594381` and `CHEMBL4594382` described in plan §3. Their JAK3/TYK2
mechanisms must not enter ruxolitinib. Melphalan's parent and hydrochloride
have the same DNA mechanism, collapsed to one `non_protein_target` item.
Melphalan stays only in `drug_targets.json`: it has no protein Targets and
cannot enter this shortlist through direct Target evidence. Venetoclax,
which inhibits the Disease Target BCL2, replaces it in the Candidate result,
evidence packet and Model jury. TP53 and CCND1 are Disease Targets that no
fixture Candidate acts on. Baricitinib includes TYK2 through bioactivity
only, with null action type; JAK1 has both mechanism and bioactivity support.

**One record gets one E ID within the Experiment.** JAK1 and JAK2 association
items are shared unchanged by baricitinib and ruxolitinib. Each Candidate
cites an association item for every one of its Targets present in the
Disease Target sample. `values` holds numbers only (or is `{}`); source
names, Target names, action types and warning classes belong in `statement`.
Statements use the same source-naming templates as real data; the fixture
numbers remain fictional. A bioactivity item's `source_id` identifies the
molecule/ChEMBL-target pair, and its URL queries activities for that pair
with non-null pChEMBL values.

Enums: Candidate `status` is `scored` or `not_scorable`; `selected_by` contains
`network` and/or `evidence`; Target `support` contains `mechanism` and/or
`bioactivity`. Mapping `status` is `mapped`, `unmapped` or `ambiguous`, with a
reason for either non-mapped status. Evidence `source` is `open_targets` or
`chembl`; `kind` is `target_association`, `mechanism`, `bioactivity`, `approval`
or `warning`. Safety is `warnings_recorded` or `unknown`, never safe.
Juror `status` is `valid`, `invalid` or `failed`; `decision` is `investigate`,
`watch` or `deprioritise`; `direction` is `supported`, `contradicted` or `unknown`.
The live mechanism action type here is `INHIBITOR`.

Jurors see only `disease.name`; each Candidate's `label`, `name`, Target
`name` and `mechanism`, `evidence_ids` and `safety_status`; and each evidence
item's `id`, `kind`, `statement` and `values`. `candidate_id`, Target IDs,
`source_id` and `url` are never sent to jurors. The stored packet preserves
those identifiers for traceability. It contains no network result, selection
reason or baseline/overall rank. Approval Disease IDs in `drug_targets.json`
are complete A6 unions across each parent and its included salts, used only
as display/evaluation labels. Approval evidence states only that an
approval exists; no evidence item asserts a Candidate–Disease indication or
trial relationship. Missing warning records mean `unknown`; recorded warnings
are not an exhaustive safety assessment. Each warning stores `evidence_id`,
`type`, `toxicity_class` and the source's own `description` (null for these
records). Model jury reviews cite warnings only in `safety`, never as
supporting or contradicting biological evidence.

With n Candidates, Borda gives rank r exactly n − r points, summed over valid
jurors. Ties share the higher rank, skipping subsequent positions (1, 2, 2, 4).
For m valid jurors, Rᵢ is Candidate i's rank sum,
S = Σᵢ(Rᵢ − m(n+1)/2)² and Kendall's W = 12S / [m²(n³ − n)], rounded to four
decimals; W is null below two valid jurors. `contested` means valid jurors gave
different decisions. Here the points are 6, 3, 3, 0, W is 0.9000, and C3 is
contested. The invalid juror supplies no vote. Reviews are examples, not model
calls. **All three model IDs were checked in the team's Snowflake account: each
answered through `AI_COMPLETE`** (Anthropic, OpenAI and Zhipu `glm-5.3`;
`glm-5.3` replaced `llama3.1-8b`, which is too small for this review).

Live verification on 2026-10-24 (no credentials):

- Disease IDs and six ENSG associations: POST [Open Targets GraphQL](https://api.platform.opentargets.org/api/v4/graphql), `diseases(efoIds: ["MONDO_0009693", "EFO_0001378"]) { id name obsoleteTerms }` and both `associatedTargets` pages of size 3000; the old EFO ID is in `obsoleteTerms`. BCL2, TP53 and CCND1 each have non-excluded association evidence in 26.09.
- Parent and salt IDs: [ChEMBL molecule REST](https://www.ebi.ac.uk/chembl/api/data/molecule.json), `molecule_hierarchy__parent_chembl_id=<parent>&limit=100`, for all five parents; check `molecule_hierarchy.parent_chembl_id`. No pages remained. Venetoclax's parent is `CHEMBL3137309`.
- Approval Disease IDs and report IDs: Open Targets A6 `drugs(chemblIds: ...) { indications { rows { maxClinicalStage disease { id } clinicalReports { id source clinicalStage url } } } }`, requiring `APPROVAL` plus a regulator report. All included parent/salt IDs were queried; each fixture list includes every qualifying Disease returned, deduplicated after merging salts.
- Mechanism IDs: [ChEMBL mechanisms](https://www.ebi.ac.uk/chembl/api/data/mechanism.json), `parent_molecule_chembl_id=<parent>&limit=100`; retain records 7379, 5293, 5294, 934, 936 and 5516 for shortlisted Candidates. Open Targets confirms all four FGFR mappings and venetoclax → BCL2. Melphalan mechanism 1858 targets [CHEMBL2311221](https://www.ebi.ac.uk/chembl/api/data/target/CHEMBL2311221.json), `NUCLEIC-ACID` DNA.
- Bioactivity pairs: human `SINGLE PROTEIN` [JAK1 CHEMBL2835](https://www.ebi.ac.uk/chembl/api/data/target/CHEMBL2835.json) / P23458 and [TYK2 CHEMBL3553](https://www.ebi.ac.uk/chembl/api/data/target/CHEMBL3553.json) / P29597 map through Open Targets `proteinIds`. ChEMBL `activity.json?molecule_chembl_id=CHEMBL2105759&target_chembl_id=<target>&pchembl_value__isnull=false` returns real human activities for both pairs; the fixture medians and counts are invented.
- Warning IDs and text: Open Targets `drugs { drugWarnings { id description warningType toxicityClass references { id source url } } }`, including ruxolitinib phosphate; preserve record IDs, type, class and null description. Exclude the ruxolitinib parent warning inherited from the known bad deuruxolitinib link.
- STRING IDs: [current version API](https://string-db.org/api/json/version) returned 12.5. Downloaded the complete [human protein.info 12.5](https://stringdb-downloads.org/download/protein.info.v12.5/9606.protein.info.v12.5.txt.gz) into `data/string/` and all three Parquet parts of the [Open Targets 26.09 target dataset](https://open-targets-public-data-releases.s3.eu-west-1.amazonaws.com/?list-type=2&prefix=platform/26.09/output/target/) into `data/ot/target/`. The complete listing was not truncated. Across 78,733 Target rows, 370,886 distinct `ensembl_PRO` IDs were compared with all 19,699 human STRING proteins. The difference has 487 proteins, including `9606.ENSP00000053469`, now an `unmapped` row with null `target_id`. The other ten fixture Targets map exactly after dropping only `9606.`. These verification counts describe downloaded source data; fixture coverage counts describe fixture rows.
- PubChem IDs: read each parent's ChEMBL `molecule_structures.standard_inchi_key`, then call [PUG REST by InChIKey](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/inchikey/OLAHOMJCDNXHFI-UHFFFAOYSA-N/cids/JSON). Verified erdafitinib `OLAHOMJCDNXHFI-UHFFFAOYSA-N` → 67462786; baricitinib `XUZMWHLSFXCVMG-UHFFFAOYSA-N` → 44205240; ruxolitinib `HFNKQEVNSGCOJV-OAHLLOKOSA-N` → 25126798; venetoclax `LQBVNQSMGBZMKD-UHFFFAOYSA-N` → 49846579. CIDs are lookup IDs, not join keys or scores.
- Releases: Open Targets `meta { dataVersion { year month } }` returned 26.09; [ChEMBL status](https://www.ebi.ac.uk/chembl/api/data/status.json) returned ChEMBL_37; STRING returned 12.5. The Experiment UUID and E/C IDs are local fixture identifiers.

Run `.venv/bin/python -m pytest -q`. No live APIs or model calls are needed
for the fixture tests. Only Snowflake model availability remains unverified.
Fictional numerical values and network outcomes are deliberately not verified
against measurements. Downloaded source datasets remain under ignored `data/`.
