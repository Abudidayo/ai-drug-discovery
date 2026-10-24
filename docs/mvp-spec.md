# OxHack drug discovery MVP scope

Build a guided app for students to explore existing approved drugs worth investigating for a disease. The core experience connects scientific evidence with an interactive view of predicted protein-drug binding poses.

## User journey

1. **Search any disease.** Feature COVID-19 and multiple myeloma as demo starting points. Broad search does not guarantee available evidence or docking support.
2. **Explore targets and candidates.** Find disease-linked proteins and existing approved drugs acting on them. Highlight five candidates with reasons, mechanism variety, 2D molecule drawings and evidence links, with the full candidate list expandable.
3. **Compare the model jury.** Give several models the same evidence and show their rankings, explanations, agreement and disagreement. Display all supported target connections without an automatic bonus for hitting more targets. Keep docking scores separate from the evidence ranking in the MVP. Model agreement is not a treatment-success probability.
4. **Request docking.** The user selects a contender and a supported protein, then generates poses for that pair. Begin with one drug per request; users can investigate another contender afterward. Docking is limited to prepared, tested protein structures, with availability explained before submission.
5. **Inspect the result.** A simple 3D viewer supports rotate/zoom, a protein-surface toggle and selection between poses. Preserve the chosen pair, method, score meaning and result provenance alongside the view. Show progress during computation and explicit failures. A pose does not establish binding strength or treatment effectiveness.
6. **Compare candidates and revisit history.** Compare candidate drugs within the same experiment. Automatically save experiment history, including requested docking results, and allow experiments to be archived and restored. Comparing different experiments or changing jury settings is not required to compare drugs. Use a shared database with an experiment identifier to retain results. Database forks and experiment branching are out of scope. Archiving can be disabled while docking is active to keep the first version simple.

## Evidence and empty results

Keep candidates with serious side effects visible with prominent, sourced warnings that the jury discusses. Display missing safety information as **unknown**, and never label a candidate **safe**. Guided mode explains each stage in plain English. If targets or matching drugs are unavailable, explain where the search stopped, retain the evidence found, and let the user choose another disease. Do not fabricate candidates or substitute an unrelated disease.

## Demo proof

Include the COVID-19/baricitinib known-answer check and label the established treatment relationship explicitly. Verify whether the evidence pipeline surfaces the candidate; never insert it or force its rank to make the demo pass. This checks pipeline behavior, not general therapeutic accuracy or a new discovery. Any docking control must identify its actual protein; a JAK2 structure must not be presented as JAK1 validation.

## Delivery boundary

Interactive docking is committed MVP scope. Prefer DGX Spark, with local Mac CPU execution as the intended fallback; compatibility and usable latency require early testing. Existing cloud GPU access is another option. Docking execution and result files form one focused build task; the viewer is a separate integration task. Decide owners with the team. Benchmark startup, warm requests, output validity and one experimental control on the actual machine. A response under two minutes is a target, not a measured capability.

Use Snowflake Cortex for the model jury and a shared Tiger Cloud PostgreSQL database for experiment history, cached evidence and docking status/result references. Store molecular result files in file or object storage. Do not implement database forks, experiment branching or comparisons between experiments. Account existence is reported; access is not verified. The required tasks and delivery checks are listed in [the team build plan](team-build-plan.md). Architecture and team allocation remain for the team discussion. [Demo script and pitch](https://linear.app/abudi-acc/issue/ABU-14/demo-script-and-pitch) is a separate human-led task outside the OxHack discovery hierarchy.

**Only if time remains:** generating entirely new molecules, after the core experience works and the team can justify the feature. It is not promised in the MVP pitch. Molecule editing, training our own models and clinical recommendations are outside the core build.

Decision record: [Lock the MVP scope](https://linear.app/abudi-acc/issue/ABU-12/lock-the-mvp-scope). Supporting research: [docking](../.context/research/docking.md) and [deployment](../.context/research/docking-deployment.md).
