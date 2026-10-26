# OxHack '26 drug discovery app

An app that, given a disease, finds existing drugs worth testing against it and explains why. It is pitched to students learning how drug discovery works; researchers are a secondary audience.

## Language

**Disease**:
The condition a user wants treatment ideas for.
_Avoid_: indication, condition (in the UI)

**Target**:
A protein linked to a disease that a drug can act on.
_Avoid_: gene, receptor (unless that is the specific kind)

**Candidate**:
An existing approved drug the app has found for a disease, because it acts on one of that disease's targets or on a protein close to them in the protein network.
_Avoid_: hit, lead, compound (in the UI)

**Binding pose**:
A predicted 3D position, orientation and conformation of a drug relative to a target protein. A pose describes how they might fit together; it does not establish binding strength or treatment effectiveness.
_Avoid_: new molecule, proven binding

**Model jury**:
Several AI models given the same evidence about the same candidates, each ranking them and explaining why. Their agreement describes consistency between their judgments, not the probability that a candidate will treat a disease.
_Avoid_: ensemble, multi-model

**Guided mode**:
A way of running the app in which each step explains in plain English what it is doing and why.

**Known-answer check**:
An experiment using a disease-drug relationship already established in the evidence, to check whether the pipeline surfaces that candidate. It demonstrates pipeline behavior rather than a new discovery or general treatment accuracy.
_Avoid_: clinical validation, discovery proof

**Experiment**:
One exploration of one **Disease** with one **Model jury** configuration and one set of ranking settings. Its candidate results and any requested docking results are saved in history.
_Avoid_: run, job, trial (in the UI)

**Candidate comparison**:
A side-by-side view of candidate drugs within one experiment, including their evidence, warnings and available docking results.
_Avoid_: experiment comparison, jury comparison (for this user action)

**Archive**:
Hide a saved experiment from the main history while keeping it recoverable.
_Avoid_: delete, discard

## Relationships

- A **Disease** has zero or more **Targets**
- A **Candidate** acts on one or more **Targets**
- A **Model jury** ranks the **Candidates** for one **Disease**
- An **Experiment** has exactly one **Disease** and one **Model jury**; its **Candidates** can be compared side by side
