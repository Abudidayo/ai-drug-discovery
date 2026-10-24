# OxHack '26: Drug discovery explorer

An educational research app for students. Pick a disease, and it suggests existing approved drugs worth investigating, with the evidence behind each one.

## How it works

1. Search a disease and see its linked proteins (targets), with sources.
2. Rank approved drugs by network proximity: how close their targets sit to the disease's proteins on a protein-interaction network. A direct-evidence ranking is shown alongside as the baseline.
3. A Model jury reviews the same evidence and challenges each candidate.
4. Optionally inspect a predicted binding pose in 3D for a supported drug–protein pair.
5. Save experiments, compare candidates, and archive or restore history.

Results are research hypotheses, not medical advice. A ranking, a jury verdict or a binding pose does not show that a drug treats a disease.

## Start here

- [Plan](plan.md): the official plan.
- [Glossary](CONTEXT.md): shared terms and scientific limits.
- [Build reference](docs/build-reference.md): verified API queries, database schema and docking steps.

## Background

- Research notes in `research_notes/`, with a summary report in `reports/`. These are a dated record; where they differ from the plan, `plan.md` wins.
- Data-source test bench in `demos/data-sources/`.
- UI prototypes in `prototypes/`; open the HTML files in a browser.
