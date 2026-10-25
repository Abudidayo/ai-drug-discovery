# HalfLife

**A second life for existing medicines.**

Pick a disease. HalfLife finds approved drugs that might help, shows why, and lets three AI models argue over the evidence.

**Live demo:** https://oxhack-workstream-c-x55r7x9w6gv4hp9gw-5173.app.github.dev/

The ranking comes from biomedical data and graph algorithms, not from an AI model. The AI only reviews the shortlist.

## How it works

```mermaid
flowchart TD
    A["Disease"] --> B["Disease Targets<br/>Open Targets"]
    C["1,956 approved drugs<br/>ChEMBL + regulators"] --> D["Drug Targets"]
    B --> E["Protein network<br/>STRING, 19,199 genes"]
    D --> E
    E --> F["Rank every drug<br/>random walk with restart"]
    F --> G["Shortlist of 15<br/>10 network + 5 direct evidence"]
    G --> H["Evidence packets<br/>with network paths"]
    H --> I["Model jury, blind<br/>GPT-5.4 · GLM-5.3 · Kimi K3<br/>via Snowflake Cortex"]
    I --> J["Compare Candidates<br/>+ optional docking"]
```

1. **Targets.** Open Targets gives the proteins linked to the disease. ChEMBL gives each drug's proteins.
2. **Network.** We place both on a map of human protein interactions (STRING 12.5).
3. **Ranking.** A random walk from the disease's proteins scores how strongly each drug's proteins are reached.
4. **Shortlist.** The top 10 by network plus the top 5 by direct evidence make 15 Candidates.
5. **Explanation.** Each Candidate shows the protein paths that link it to the disease.
6. **Model jury.** Three AI models (GPT-5.4, GLM-5.3 and Kimi K3, via Snowflake Cortex) review the same cited evidence without seeing the scores. Every claim must cite real evidence.
7. **Docking (optional).** AutoDock Vina predicts how a drug might sit in its protein.

## The ranking engine: random walk with restart

Picture a walker on the protein network. It starts on the disease's proteins and keeps stepping to random neighbours. At every step it has a 30% chance of jumping back to a disease protein. After many steps, proteins near the disease get visited often; distant ones rarely.

A drug scores high when its target proteins get visited a lot.

```mermaid
flowchart LR
    D1(("Disease<br/>protein")) --- X(("protein"))
    D2(("Disease<br/>protein")) --- X
    X --- T1(("Drug A<br/>target"))
    D2 --- T2(("Drug B<br/>target"))
    X --- Y(("protein"))
    Y --- Z(("protein"))
    Z --- T3(("Drug C<br/>target"))
    classDef disease fill:#f6c1c1,stroke:#b33
    classDef drug fill:#c1d8f6,stroke:#3366b3
    class D1,D2 disease
    class T1,T2,T3 drug
```

Drug B's target is one step from a disease protein, so it's visited most. Drug A is close behind. Drug C is far away and scores lowest.

Unlike a single shortest path, the walk counts every route between a drug and the disease.

**More detail:** the maths, settings and test results are in [`ranking/RWR.md`](ranking/RWR.md).

**The shortlist.** The top 10 drugs by walk score, plus the top 5 by direct evidence (their targets are themselves disease proteins), make 15. Shortest paths from each drug's targets to the disease's proteins are saved as the explanation.

**The jury's checks.** Each reply must be valid JSON, rank every Candidate once, cite only real evidence IDs, and quote numbers exactly as the evidence states them. Failed or refused replies are recorded, never filled in. Votes are combined by Borda count over the valid jurors (at least two).

## Results

We test whether known approved drugs come back, with rules fixed before each test.

| Test | Result |
|---|---|
| Network shortlist, 14 diseases | Random walk found **15 of 293** known drugs; the older z-score method found 11. Not a significant difference. |
| Model jury, 14 new diseases, drug names hidden | GPT-5.4 alone ranked the right drug about **twice as well as chance** (MRR 0.46 vs 0.22). The three-model jury did not beat chance. |

These are research leads, not treatment advice. Details, protocols and errata are in [`results/`](results/).

## Data

| Source | Used for |
|---|---|
| [Open Targets](https://platform.opentargets.org/) 26.09 | Disease–protein links |
| [ChEMBL](https://www.ebi.ac.uk/chembl/) 37 | Drugs and their proteins |
| [STRING](https://string-db.org/) 12.5 | Protein interactions |
| [Reactome](https://reactome.org/) | Pathways |
| [RCSB PDB](https://www.rcsb.org/) | Protein structures for docking |
| FDA, EMA, PMDA, DailyMed | Approvals and safety warnings |

Large downloads stay out of Git. Each source keeps its own licence.

## Repository

```text
pipeline/      Data: diseases, drugs, protein mapping, evidence packets
ranking/       Network, scoring, shortlist, evaluation
workstream_b/  App-facing shortlist and paths
jury/          Model jury client and checks
fixtures/      Sample data formats
results/       Experiments, protocols, errata
plan.md        Project specification
```

## Run the tests

```bash
uv sync
uv run pytest                                   # pipeline and jury
python -m pip install -e ./ranking
python -m unittest discover -s ranking/tests    # network ranking
```

The jury has a mock mode, so no Snowflake account is needed for tests. Building real rankings needs the source data; see [`ranking/README.md`](ranking/README.md).

## Team

Built at OxHack '26.

- **Jessica:** data pipeline, evidence, Model jury, experiments.
- **Zaid:** protein network, ranking algorithms, shortlist, evaluation.
- **Abudi:** app, backend, docking, deployment.
