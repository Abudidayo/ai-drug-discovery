# On-demand docking / binding-pose generation for a 24-hour hackathon (OxHack '26)

> **Older research snapshot.** Where this note differs from `plan.md`, follow `plan.md`. In particular: docking runs AutoDock Vina on CPU (no rented GPUs), the Model jury uses three Snowflake Cortex model families (no Gemini), and IDs are mapped through UniProt and Ensembl IDs, never gene symbols.


Research date: 24 Oct 2026. All "as of" statements refer to sources fetched on that date. Claims I could not verify against a primary source are marked **[UNVERIFIED]**.

## Does DiffDock (or its NIM) run on DGX Spark (aarch64, Blackwell sm_121)? What about PyTorch Geometric / torch-cluster / e3nn, Boltz-2 and GNINA?

### Takeaway

Do not plan on DiffDock running on the DGX Spark. The DiffDock NIM has no ARM64 image and GB10 is absent from its support matrix, and an April 2026 forum question about ARM DiffDock NIMs still has zero replies. Boltz-2 is the opposite case: its NIM support matrix now explicitly lists GB10 (DGX Spark), while the open-source `boltz` package hangs on GB10 unless you swap in a custom sm_121 PyTorch wheel.

### Cited Findings

**DiffDock NIM on DGX Spark — no**
- The DiffDock NIM support matrix (page last updated 6 Jul 2026) lists only H100 80GB, H200, A100-SXM4-80GB, A100-SXM4-40GB, L40S, RTX A6000 and A10G. There is **no GB10, DGX Spark, Grace or aarch64 entry**, and the page does not state a CPU architecture. Minimums: 4 CPU cores, 8 GB RAM, 40 GB NVMe, 1 GPU, Docker ≥ 23.0.1, NVIDIA driver ≥ 535.104.05, Container Toolkit ≥ 1.13.5 — [NVIDIA NIM for DiffDock support matrix](https://docs.nvidia.com/nim/bionemo/diffdock/latest/support-matrix.html)
- A DGX Spark owner (user `faisal14`, 22 Apr 2026, Ubuntu kernel 6.17.0-1008-nvidia, aarch64) posted "all the NIM images are amd64 architecture", with nothing for aarch64, and asked for guidance on DiffDock NIMs for ARM. **The thread had zero replies when fetched on 24 Oct 2026** — [NVIDIA Developer Forums](https://forums.developer.nvidia.com/t/question-dgx-spark-aarch64-any-guidance-on-accessing-diffdock-nims-for-arm/367546)
- The underlying failure mode for amd64-only NIMs on Spark is a Docker `exec format error` from the platform mismatch (`linux/amd64` image vs `linux/arm64/v8` host) — [NVIDIA Developer Forums, 29 Oct 2025](https://forums.developer.nvidia.com/t/none-of-the-biology-nim-containers-can-run-on-dgx-spark-correct/349486)
- On 30 Oct 2025 a responder (`aniculescu`, role not stated on the page) confirmed the msa-search (ColabFold) and Boltz-2 NIMs "do not have images built for ARM64", pointing users to the "NIM on Spark" playbook (build.nvidia.com/spark/nim-llm) and NIM release notes to see which NIMs support Spark — [same thread](https://forums.developer.nvidia.com/t/none-of-the-biology-nim-containers-can-run-on-dgx-spark-correct/349486)
- Related open threads on the same forum: "Missing official native ARM64 NIM images for essential AI models" (20 Mar 2026, 6 replies) and "NIMs should be built multiplatform" (27 Oct 2025) — [thread index](https://forums.developer.nvidia.com/t/none-of-the-biology-nim-containers-can-run-on-dgx-spark-correct/349486)

**DiffDock from source — what the repo actually requires**
- The official install is Conda-based: `conda env create --file environment.yml; conda activate diffdock`. A Docker route exists (`docker build . -f Dockerfile -t diffdock`, or pull `rbgcsail/diffdock`, run with `--gpus all`). The README does **not** pin torch / torch-geometric / torch-cluster / e3nn / CUDA versions on its front page — those live in `environment.yml` and `requirements.txt` — [gcorso/DiffDock README](https://github.com/gcorso/DiffDock)
- DiffDock-L is the **default** model in the repo and the README describes it as "a significant improvement in performance and generalization capacity" over the original; the most recent dated note in the README is the Feb 2024 DiffDock-L update — [gcorso/DiffDock](https://github.com/gcorso/DiffDock)
- Inputs: protein `.pdb` via `--protein_path` or an amino-acid sequence folded with ESMFold via `--protein_sequence`; ligand as a SMILES string or RDKit-readable `.sdf`/`.mol2` via `--ligand`. Batch mode takes a CSV with `complex_name, protein_path, ligand_description, protein_sequence`. A Gradio UI runs at `localhost:7860` via `python app/main.py` — [gcorso/DiffDock](https://github.com/gcorso/DiffDock)
- Output: `--save_visualisation` writes `.sdf` files of the generated molecules — [gcorso/DiffDock](https://github.com/gcorso/DiffDock)
- Licence: **MIT for both code and model weights** (integrating MIT-licensed components of spyrmsd by Rocco Meli) — [gcorso/DiffDock](https://github.com/gcorso/DiffDock)
- Hardware: GPU "recommended" because it "runs significantly faster"; **CPU use is possible with `.pdb` inputs**. On first run per device, the program precomputes SO(2)/SO(3) lookup tables, taking "a couple of minutes", then caches them. No per-complex runtime figure is given and **Apple Silicon is not mentioned** — [gcorso/DiffDock](https://github.com/gcorso/DiffDock)
- The original DiffDock paper reports GPU inference 3–12× faster than GNINA, the best search-based method it compared against — [DiffDock paper, arXiv:2210.01776](https://arxiv.org/pdf/2210.01776)

**Boltz-2 on DGX Spark — officially supported via NIM, fragile from source**
- The Boltz-2 NIM support matrix (page last updated 30 Sep 2026) **does list "NVIDIA GB10 (DGX Spark), 128 GB, 1 GPU"** among tested GPUs (optimized backend, BF16). Minimums: 12 CPU cores, 64 GB RAM, 80 GB NVMe (image ≈ 73 GB), GPU ≥ 48 GB; Docker ≥ 23.0.1, **NVIDIA driver ≥ 590.44.01 with CUDA 13.1**, Container Toolkit ≥ 1.13.5. Release 1.9.0 uses a single untagged profile `af1349b9…f3262` for all GPUs; per-GPU profile hashes from 1.8.0 and earlier are no longer in the manifest — [NVIDIA NIM for Boltz-2 support matrix](https://docs.nvidia.com/nim/bionemo/boltz2/latest/support-matrix.html)
- This **contradicts** the Oct 2025 forum statement that the Boltz-2 NIM had no ARM64 image — [forum, Oct 2025](https://forums.developer.nvidia.com/t/none-of-the-biology-nim-containers-can-run-on-dgx-spark-correct/349486) vs [support matrix, Sep 2026](https://docs.nvidia.com/nim/bionemo/boltz2/latest/support-matrix.html)
- Open-source `boltz` on GB10: issue #663 (opened 20 Mar 2026, **closed "not planned" 4 Oct 2026**, no maintainer fix) reports boltz 2.2.1 + a cu130 PyTorch nightly **hangs at the "Predicting" progress bar (0/?) with no output**. Log shows GPU compute capability **sm_121**, PyTorch compiled for sm_80–sm_120 plus compute_120, and "Match found: False" — [jwohlwend/boltz#663](https://github.com/jwohlwend/boltz/issues/663)
- Root cause per a commenter who reproduced it on a DGX Spark: prebuilt PyTorch wheels lack sm_121 kernels, so diffusion sampling stalls during PTX JIT compilation. Third-party workaround (unverified by maintainers): force-install `torch-2.12.0a0+gitb071fd7-cp312-cp312-linux_aarch64.whl` from `huggingface.co/Qanatpharma/pytorch-sm121-gb10` with `--force-reinstall --no-deps`; add `cuequivariance-torch` and `cuequivariance-ops-torch-cu12` from `--extra-index-url https://pypi.nvidia.com`; set `TRITON_PTXAS_PATH=/usr/local/cuda/bin/ptxas` and `TORCH_FLOAT32_MATMUL_PRECISION=high` — [jwohlwend/boltz#663](https://github.com/jwohlwend/boltz/issues/663)
- A `boltz-blackwell` PyPI package lists GB10 (DGX Spark) as supported and offers a one-command installer; its GB10 notes say CUDA 12.8 failed with JIT compilation errors, 12.9 worked, and 13.0 is recommended — [boltz-blackwell on PyPI](https://pypi.org/project/boltz-blackwell/) **[UNVERIFIED — taken from a search snippet; I did not fetch the page directly, and the snippet suggested it is ~11 months old]**

### Inferences

- The sm_121 PTX-JIT stall in `boltz` is a **PyTorch/CUDA-kernel problem, not a Boltz problem**. Any PyTorch-based docking stack on GB10 — DiffDock included — is exposed to the same class of failure, because the published wheels are compiled for sm_80–sm_120 and GB10 is sm_121. For DiffDock the risk compounds: the PyG family (`torch-geometric`, `torch-cluster`, `torch-scatter`) ships prebuilt wheels per (torch, CUDA, platform) triple, and `e3nn` is pure Python but depends on torch ops. An aarch64 + sm_121 + CUDA 13 combination is outside what those wheel matrices normally cover, so expect either source compilation (long) or silent hangs.
- **For a 24-hour hackathon, treat "DiffDock on the DGX Spark" as a research project, not a deliverable.** The failure mode documented for Boltz (a hang with no error) is the worst possible one at 3 a.m. — it burns hours with nothing to debug.
- If the DGX Spark must be the compute story for the demo (e.g. for a sponsor narrative), **Boltz-2 via the NIM container is the only path with an official GB10 entry**. Budget for the 73 GB image pull and verify the driver is ≥ 590.44.01 / CUDA 13.1 before the event — a driver upgrade on hackathon day is a day-ender.

### Gaps

- **No source found** on whether GNINA builds or runs on DGX Spark / aarch64 / sm_121. GNINA's own benchmark hardware is x86 + RTX 3080 ([GNINA 1.3 paper](https://ora.ox.ac.uk/objects/uuid:df65eb31-2faf-4035-847b-d6ae4695538e/files/r6969z2176)). GNINA builds from source against libmolgrid/CUDA, so an ARM64+sm_121 build is plausible but entirely unverified.
- No DiffDock NIM release notes or NGC manifest were located to confirm whether a multi-arch tag has appeared since the Jul 2026 support-matrix update.
- No per-complex DiffDock runtime figure (GPU or CPU) from a primary source; the README gives none.
- The exact pinned versions in DiffDock's `environment.yml` (torch / PyG / torch-cluster / e3nn) were not retrieved — the README does not list them.

## How long does AutoDock Vina take for one ligand on an Apple-silicon Mac CPU, and how much preparation is needed?

### Takeaway

Vina 1.2.7 ships an official native `mac_aarch64` binary, and the preparation path (Meeko + RDKit, two commands) is short and well documented — but **I found no published, measured runtime on M-series silicon**. You must benchmark it yourself; Vina's own docs confirm runtime scales with `exhaustiveness` and that Monte Carlo optimisation is >90% of the work.

### Cited Findings

**Versions and Apple-silicon binaries**
- v1.2.7 is the latest release. Its notes: fixes the Python `set_weights` function for AD4 scoring, updates docs, fixes GitHub Actions workflows, **forces cross-compilation of the Mac x86_64 build on arm64 runners**, adds docstrings for the `vinardo` scoring function in the Python bindings, and makes `--batch` accept directories. The releases page shows "26 Feb" without a year — [AutoDock-Vina releases](https://github.com/ccsb-scripps/AutoDock-Vina/releases)
- The v1.2.5 entry carries a 24 Sep 2024 update stating "Included updated binaries for Mac aarch64, built by Github Actions" — the only explicit Apple-silicon mention on the releases page — [AutoDock-Vina releases](https://github.com/ccsb-scripps/AutoDock-Vina/releases)
- A third-party setup guide states the official `vina_1.2.7_mac_aarch64` binary runs natively, that Vina is CPU-bound and multithreaded, and that M-series performance cores "do real work here". Qualitative only, **no timings** — [STEM Skills Lab, GROMACS and AutoDock Vina on Mac: Apple Silicon Setup](https://stemskillslab.com/gromacs-autodock-vina-mac-apple-silicon/)

**Runtime behaviour**
- The docking calculation is a number of independent runs from random conformations; **the number of runs is set by `exhaustiveness`**, the runs execute in parallel where appropriate, and `exhaustiveness` therefore also limits parallelism. Raising it lengthens runtime. Default is 8; the docs say "increasing this to 32 will give a more consistent docking result" — [Vina FAQ](https://autodock-vina.readthedocs.io/en/latest/faq.html)
- Monte Carlo-based optimisation is "the most time-consuming part (typically more than 90%)" of a Vina run — [Accelerating AutoDock Vina with GPUs](https://www.researchgate.net/publication/360497140_Accelerating_AutoDock_Vina_with_GPUs)

**Preparation effort**
- The official tutorial's dependency line is `pip install -U numpy scipy rdkit vina meeko gemmi prody` — [Vina basic docking tutorial](https://autodock-vina.readthedocs.io/en/latest/docking_basic.html)
- Ligand prep is **one command**: `mk_prepare_ligand.py -i 1iep_ligand.sdf -o 1iep_ligand.pdbqt`. Meeko also installs command-line scripts for receptor preparation — [Vina basic docking tutorial](https://autodock-vina.readthedocs.io/en/latest/docking_basic.html)
- Meeko **writes a SMILES string into the PDBQT header**, which lets it rebuild the RDKit molecule with the original bond orders and charges, and convert docking output back to SDF — [Vina basic docking tutorial](https://autodock-vina.readthedocs.io/en/latest/docking_basic.html). This is the mechanism that makes PDBQT→SDF round-tripping safe enough to feed a browser viewer.
- **The Python bindings and the binary are separate installs**: "the python bindings installation does not include the Vina executable", and vice versa — [Vina docs](https://autodock-vina.readthedocs.io/en/latest/docking_basic.html)
- Version pairings seen in recent papers: Vina 1.2.6 + Meeko 0.6.1; Vina 1.2.3 + Meeko 0.4.0 — [Vina docs PDF / cited literature](https://autodock-vina.readthedocs.io/_/downloads/en/latest/pdf/)

### Inferences

- **Budget benchmarking time, not guesswork.** Because Vina parallelises across `exhaustiveness` runs and M-series chips have ~8–12 performance cores, a single drug-like ligand in a defined ~22–25 Å box at default `exhaustiveness=8` is the regime that should finish in a demo-acceptable time on a laptop, with runtime rising roughly in proportion as you go to 16 or 32. **Treat any specific seconds figure as unmeasured until the team times it on their own machine** — that measurement is a 10-minute task and should be the first thing the docking owner does.
- The honest demo design is to **pin `exhaustiveness` and the box, then show the measured wall-clock in the UI**. If the measured time is too long for a live demo, the mitigations in order are: shrink the box to the known pocket, lower `exhaustiveness`, cap `--num_modes`, and pre-warm a cache for the two demo pairs.
- Preparation is the under-estimated cost, not docking. Realistic prep chain: fetch PDB → strip waters/ions/other chains → decide protonation → receptor PDBQT; fetch ligand SMILES (ChEMBL/PubChem) → RDKit 3D embed + minimise → `mk_prepare_ligand.py` → ligand PDBQT; compute box centre from the co-crystallised ligand's coordinates. The box-centre step is the one most likely to silently produce nonsense if automated badly.
- Using the **Vina Python bindings rather than the CLI** avoids shelling out and makes it easy to return pose SDF text directly to the API layer — but remember the bindings do not give you the executable, so pick one and stick with it.

### Gaps

- **No measured Apple-silicon (M1/M2/M3/M4) Vina runtime in seconds was found in any source.** The only runtime comparison located (the Vina-GPU paper) used an Intel i9-10900K on Windows at `exhaustiveness=128`, which does not transfer.
- No v1.2.7 release date with a year was visible on the releases page (shown as "26 Feb"); the year is most likely 2025 or 2026 but is **[UNVERIFIED]**.
- No official guidance found on protonation tooling choice (PDB2PQR / reduce / OpenBabel `-p`) for this workflow.

## Which hosted APIs could replace local compute, what do they cost, and what are their rate limits?

### Takeaway

NVIDIA's build.nvidia.com hosted NIM endpoints are the most credible pinch-hitter — they sidestep the ARM64 problem entirely because the compute runs on NVIDIA's x86 DGX Cloud — but the free tier is a **capped credit trial (1,000 on sign-up, 5,000 max) with a commonly reported ~40 RPM limit and no official path to an increase**. Tamarind Bio and Neurosnap pricing is only documented by third-party aggregators and is unreliable.

### Cited Findings

- An NVIDIA moderator states the API catalog "is a trial experience of NVIDIA NIM limited to 5000 free API credits. Upon sign-up, users are granted 1000 API credits. To obtain more, click on your profile from within the API catalog → 'Request More'." A personal-email signup can unlock 4,000 more credits by providing a business email to activate a free 90-day NVIDIA AI Enterprise licence — [NVIDIA Developer Forums: API credits for build.nvidia.com](https://forums.developer.nvidia.com/t/api-credits-for-build-nvidia-com/306633). **This post predates the current period and may be out of date.**
- Users repeatedly report a **40 RPM** limit and file requests to raise it to 200 RPM; a forum moderator replied that the rate limit "is dependent on model, use-case and the amount of current overall traffic using the same access" and that "there is no official way to circumvent this rate limit or to receive a rate limit increase on that same tier" — [NVIDIA Developer Forums rate-limit increase request](https://forums.developer.nvidia.com/t/request-for-nvidia-build-api-rate-limit-increase-40-rpm-200-rpm/378450)
- A third-party profile claims exhausted free credits return an **authorization error rather than a throttling error** — [apis.io NVIDIA rate limits](https://apis.io/rate-limits/nvidia/nvidia-rate-limits/) **[UNVERIFIED against NVIDIA docs]**
- Tamarind Bio: a skills directory says "every user gets 10 free jobs" and larger usage requires emailing info@tamarind.bio for a subscription — [Tamarind Bio skill page](https://www.getclaudeskills.com/skills/tamarind-bio-k-dense-ai). A company-data aggregator lists a free tier of 10 monthly jobs with a Premium tier "starting from $50,000 annually" — [Extruct profile](https://www.extruct.ai/hub/tamarind-bio/). A third source describes pricing simply as usage-based with a free start — [Penrone](https://www.penrone.com/en/tools/tamarind-bio). **These sources conflict and none is Tamarind's own pricing page.**
- Tamarind exposes an API (API key created from account/API settings at app.tamarind.bio) and advertises molecular docking tools at scale — [Tamarind Bio tools](https://app.tamarind.bio/tools/dockq), [skill page](https://www.getclaudeskills.com/skills/tamarind-bio-k-dense-ai)
- Neurosnap lists pay-as-you-go at **$1.00 per credit**, a Standard plan at 14 credits/month, and a Professional plan at 75 credits/month that includes "Full API Access" — [neurosnap.ai](https://neurosnap.ai/). The search tool reported the page text as garbled, so **the displayed prices may be misread [UNVERIFIED]**. A third-party page describes a "job" as a computational task such as a folding prediction, docking simulation or pipeline run, each consuming a defined number of credits — [NeuroSnap Pricing Plans 2026](https://www.graphstats.net/neurosnap-pricing)
- The DiffDock NIM exists as a hosted model on build.nvidia.com (the NIM docs and support matrix are published under `docs.nvidia.com/nim/bionemo/diffdock/`) — [DiffDock NIM docs](https://docs.nvidia.com/nim/bionemo/diffdock/latest/support-matrix.html)
- OpenFold3 is available as a hosted NVIDIA endpoint with a model card dated 13 Mar 2026 — [build.nvidia.com/openfold/openfold3](https://build.nvidia.com/openfold/openfold3/modelcard), [NVIDIA API reference](https://docs.api.nvidia.com/nim/reference/openfold-openfold3)

### Inferences

- **The hosted-NIM route is the fallback that actually resolves the DGX Spark problem**: the ARM64 image gap is irrelevant when you POST JSON to NVIDIA's endpoint. For a hackathon this is also the cheapest and fastest to wire — an API key and an HTTP client, no CUDA.
- A ~40 RPM cap and a few-thousand-credit budget are **more than sufficient for a guided demo app** where a user docks one drug against one structure. They would not survive an unthrottled public demo, so put a server-side queue and a per-session cap in front of it.
- Because credits can exhaust into an *authorization* error rather than a 429, the client must treat 401/403 from the vendor as "fall back to Vina", not as "the user is unauthenticated". Getting this wrong produces a confusing failure on stage.
- **Sign up and smoke-test the key days before the event.** The credit-grant flow involves a profile request and possibly a business-email step, which is not something to discover at hour 3.
- Tamarind and Neurosnap are plausible emergency backups but their pricing is not documented well enough to commit to in advance; neither should be on the critical path.

### Gaps

- **Per-call credit cost of the DiffDock NIM (or any BioNeMo NIM) on build.nvidia.com was not found.** The credit figures above are catalog-wide, not model-specific.
- No official NVIDIA rate-limit table (RPM/TPM per model) was located; all figures are user-reported or moderator prose.
- Tamarind Bio's own pricing page was not retrieved; the three third-party sources disagree.
- No source found for AlphaFold 3 server job limits or licence terms, nor for Protenix's licence.

## What do PoseBusters-style benchmarks say about DiffDock vs Vina vs co-folding accuracy and physical validity?

### Takeaway

The central, repeatedly reproduced finding is that **deep-learning docking looks better than classical docking on RMSD alone and worse once physical validity is enforced** — the PoseBusters paper's own framing is that "no deep learning-based method yet outperforms classical docking tools". 2025–2026 follow-ups show co-folding models (AF3, Protenix, Chai-1) clustering around 56–69% depending on the split, and a 2026 preprint still puts Vina at ~58% PB-valid success. Numbers across papers are **not** directly comparable.

### Cited Findings

**The original PoseBusters paper**
- Submitted to arXiv 10 Aug 2023 (v3 dated 28 Nov 2023), published as *Chem. Sci.*, 2024, **15**, 3130–3139, DOI 10.1039/D3SC04185A. Its abstract states that **"no deep learning-based method yet outperforms classical docking tools"** on physical plausibility and generalisation, and that methods must "both pass these checks and predict native-like binding modes" to count as state of the art. Version 2 of the benchmark set removed ligands with crystal contacts — [arXiv:2308.05777](https://arxiv.org/abs/2308.05777)
- PoseBusters checks fall into **three categories: chemical validity and consistency, intramolecular validity, and intermolecular validity** — [alphaXiv summary of arXiv:2308.05777v3](https://www.alphaxiv.org/abs/2308.05777v3)
- On the **PoseBusters benchmark set (308 complexes)**, a summary of the paper gives PB-valid **and** RMSD ≤ 2 Å rates of: **AutoDock Vina 58%, CCDC Gold 55%, DiffDock 12%** (the best deep-learning method) — [alphaXiv summary](https://www.alphaxiv.org/abs/2308.05777v3)
- On the **Astex Diverse set**, the paper's own text notes that "the RMSD criterion alone gives the impression that DiffDock (72%) performs better than TankBind (59%), Gold (67%), AutoDock Vina (58%) and Uni-Mol (45%)", whereas on the combined RMSD + PB-valid metric **Gold (64%) and AutoDock Vina (56%) lead, and DiffDock drops to 47%** — [arXiv:2308.05777](https://arxiv.org/pdf/2308.05777) (quoted via search extraction of the paper text)
- **Conflict to flag:** the 12% DiffDock figure (benchmark set) and the 47% figure (Astex set) are from different sets in the same paper and are often conflated in secondary writing. Note also that other papers quote DiffDock at "38% PB-success" on blind docking with a different protocol, improved by ligand energy minimisation — [DiffBindFR, arXiv:2311.15201](https://arxiv.org/pdf/2311.15201)

**DiffDock's own numbers and their fragility**
- The original DiffDock paper reports **top-1 RMSD < 2 Å success of 38.2%** when sampling 40 poses and **35.0%** when sampling 10 — [arXiv:2210.01776](https://arxiv.org/pdf/2210.01776)
- **A single RDKit version change halved DiffDock's reported performance** on the 428-complex set, from ~51% to ~24%, with no change to the model — [BLOPIG, Apr 2025: "Featurisation is Key"](https://www.blopig.com/blog/2025/04/featurisation-is-key-one-version-change-that-halved-diffdocks-performance/)
- DiffDock-L's fine-tuning cost: ~8 hours on one NVIDIA A6000 (sampling 320 complexes per 200 gradient steps, interleaved 60 times, batch size 5); the authors estimate the cost amortises after ~232 inference complexes relative to GNINA — [arXiv:2402.18396](https://arxiv.org/pdf/2402.18396)
- DiffDock's README is explicit that **the confidence score is not a binding-affinity measure**, with bands: c > 0 high confidence, −1.5 < c < 0 moderate, c < −1.5 low — and these bands apply to "typical drug-like ligands and medium-sized proteins" and should shift down for large ligands or complexes — [gcorso/DiffDock](https://github.com/gcorso/DiffDock)

**PoseX (2025) — the best 2025 cross-method comparison found**
- arXiv:2505.01700v2, dated 21 May 2025. Datasets: **PoseX-SD (self-docking) 718 entries; PoseX-CD (cross-docking) 1,312 entries**; 109 protein targets (371 structures), 362 small molecules; crystal structures released Jan 2022 – Jan 2025 — [arXiv:2505.01700v2](https://arxiv.org/html/2505.01700v2)
- Astex: Uni-Mol and SurfDock (with relaxation) **94.1%**; DiffDock-Pocket, Interformer and **DiffDock-L above 83.5%**; AlphaFold3, Protenix and Chai-1 **above 80%**; AutoDock Vina and MOE **roughly 56.5–67.1%** — [arXiv:2505.01700v2](https://arxiv.org/html/2505.01700v2)
- PoseX-SD: SurfDock **78.4%**, AlphaFold3 **60.3%**, Protenix **56.0%**, DiffDock-Pocket **52.2%**, Glide/Discovery Studio ~48–55%, EquiBind and TankBind **below 20%** — [arXiv:2505.01700v2](https://arxiv.org/html/2505.01700v2)
- PoseX-CD: SurfDock **77.0%**, Uni-Mol **69.2%**, AlphaFold3 **68.7%**, GNINA **56.0%** — [arXiv:2505.01700v2](https://arxiv.org/html/2505.01700v2)
- A summary of the same work reports AF3, Protenix and Chai-1 clustering around **60–61% under conformational flexibility**, with docking-specialised models slightly ahead — [arXiv:2505.01700](https://arxiv.org/html/2505.01700v1)

**Co-folding models**
- EMBL-EBI's AlphaFold training material puts **AF3 at about 76% ligand-RMSD success on PoseBusters**, roughly matching a 77% claim for a newer co-folding model — [EMBL-EBI AlphaFold 3 validation page](https://www.ebi.ac.uk/training/online/courses/alphafold/alphafold-3-and-alphafold-server/introducing-alphafold-3/how-have-alphafold-3s-predictions-been-validated/)
- The same page says Boltz performs competitively with AF3 but trails it on some tasks, notably antibody–antigen prediction — [EMBL-EBI](https://www.ebi.ac.uk/training/online/courses/alphafold/alphafold-3-and-alphafold-server/introducing-alphafold-3/how-have-alphafold-3s-predictions-been-validated/)
- Boltz-2 is being used for binding-affinity-style prediction in downstream work, e.g. "Boltzina: Efficient and Accurate Virtual Screening via Docking-Guided Binding Prediction with Boltz-2" — [arXiv:2508.17555](https://arxiv.org/pdf/2508.17555)

**2026 datapoint**
- A Mar 2026 bioRxiv preprint applying RL to DiffDock-Pocket reports PB-validity rising from 58.8% to 78.1% for the top-ranked pose and from 38.2% to 58.9% across all sampled poses; on the PoseBusters set the RL model reaches **58.8% (RMSD ≤ 2 Å and PB-valid), vs Vina 58.1% and GOLD 54.2%** — [bioRxiv, Mar 2026](https://www.biorxiv.org/content/10.64898/2026.03.25.714128v1.full). Preprint, not peer-reviewed; its baselines differ from the original paper's.

### Inferences

- **The defensible headline for a hackathon demo is: "classical docking (Vina) and modern deep-learning docking are in the same accuracy band once you require physically valid poses, and Vina was ahead on that metric in the paper that introduced the test."** The 2026 preprint shows RL-tuned DL methods finally matching Vina at ~58–59% — i.e. parity, not a revolution. This is a *stronger* judging story than "we used the newest model", because it shows you read the evaluation literature.
- **Always report PB-validity alongside RMSD.** Running the `posebusters` package on your own generated pose is cheap and turns a pretty picture into a checked result. A pose that fails intramolecular validity (distorted bond lengths, internal clashes) is visibly wrong to a chemist judge.
- **The RDKit-version finding is the single most important methodological warning.** Pin your RDKit version and record it in the experiment history table. A result that moves 27 percentage points on a dependency bump is a result you must version-stamp.
- Co-folding models (AF3 ~76%, PoseX-SD AF3 60.3%) look strong but the spread across benchmarks is large, and they predict the *complex*, not a pose in a user-chosen prepared structure. For a "user picks a PDB structure and a drug" UX, a docking method is the honest fit; a co-folding model quietly re-predicts the protein too.

### Gaps

- **No single table running DiffDock, DiffDock-L, Vina, GNINA, Boltz-2, Chai-1, OpenFold3 and AF3 under one protocol was found.** Every comparison above comes from a different paper with a different split.
- **No PoseBusters success rate for Boltz-2 specifically was found.**
- The PoseX HTML page renders its main results in figures, so exact per-method PB-valid numbers for Vina, DiffDock, DiffDock-L, Chai-1 and Boltz-1/1x could not be extracted.
- The original PoseBusters PDF exceeded the fetch size limit, so the 308-complex figures above rest on an alphaXiv summary of the paper rather than the paper's own table. The set-size history (428 in v1 → 308 in v2 after removing crystal-contact ligands) is an **inference** from [the abstract's note about v2](https://arxiv.org/abs/2308.05777) plus [FlowDock's use of a 308-complex subset](https://arxiv.org/pdf/2412.10966) and the widely cited 428 figure — it is not directly confirmed.

## Which PDB structures are good, honest controls (JAK/baricitinib, PSMB5/bortezomib, CRBN/lenalidomide)?

### Takeaway

**6VN8 or 6WTO (JAK2 JH1 + baricitinib) is the clean, high-resolution redocking control for the COVID-19 "known-answer check"** — but note there appears to be **no JAK1–baricitinib crystal structure**, so a JAK1 claim cannot be structurally grounded. For multiple myeloma, 4TZ4 (CRBN–DDB1–lenalidomide) is usable with caveats, while 5LF3 (20S proteasome + bortezomib) is a poor redocking control because the assembly is a 28-mer and bortezomib is a covalent inhibitor.

### Cited Findings

**JAK / baricitinib (COVID-19 known-answer check)**
- **6VN8** — "JAK2 JH1 in complex with baricitinib", X-ray, **1.9 Å**, deposited 2020, authors Davis and Schonbrunn — [RCSB 6VN8](https://www.rcsb.org/structure/6VN8), [NCBI](https://www.ncbi.nlm.nih.gov/Structure/pdb/6VN8)
- **6WTO** — "Human JAK2 JH1 domain in complex with Baricitinib", **1.74 Å**, part of a CRLF2-rearranged leukemia study — [RCSB 6WTO](https://www.rcsb.org/structure/6WTO), [NCBI](https://www.ncbi.nlm.nih.gov/Structure/pdb/6WTO)
- **6WTN** — JAK2 with ruxolitinib, useful as a second JAK2 ligand for a cross-docking check — [PubMed 36366971](https://pubmed.ncbi.nlm.nih.gov/36366971/)
- **4W9X** — baricitinib bound to BMP-2-inducible kinase, **not a JAK**; a review counts three baricitinib crystal structures in the PDB, two of them JAK2 complexes — [PMC review of globally approved JAK inhibitors](https://pmc.ncbi.nlm.nih.gov/articles/PMC9146299/)
- **No JAK1–baricitinib structure was found.** A modelling paper states that no crystal structure of JAK1 with the next-generation RA drugs is available and therefore used docking and MD for baricitinib, comparing its JAK1 model against 6VN8 — [ACS Omega](https://pubs.acs.org/doi/pdf/10.1021/acsomega.1c06715)

**Multiple myeloma**
- **5LF3** — "Human 20S proteasome complex with Bortezomib at 2.1 Angstrom", X-ray 2.10 Å, deposited 2016-06-30, released 2016-08-17, **biological unit is a 28-mer** — [RCSB 5LF3](https://www.rcsb.org/structure/5LF3), [NCBI](https://www.ncbi.nlm.nih.gov/Structure/pdb/5LF3). PSMB5 (proteasome subunit beta type-5) is among the subunits; a separate study used 5LF3 to map bortezomib's binding pocket and resistance substitutions — [Leukemia, PSMB5 resistance mutations](https://www.nature.com/articles/s41375-020-0989-4)
- **4TZ4** — human **cereblon–DDB1–lenalidomide**, X-ray **3.01 Å**, deposited 2014, space group P2₁2₁2₁; chain A is DDB1 (1,146 residues), chain C is CRBN (381 residues). Primary citation: "Structural Basis for Responsiveness to Thalidomide-Analog Drugs Defined by the Crystal Structure of the Human Cereblon:DDB1:Lenalidomide Complex" (*Nat. Struct. Mol. Biol.*, 2014) — [RCSB 4TZ4](https://www.rcsb.org/structure/4TZ4), [PDBe](https://ebi.ac.uk/pdbe/entry/pdb/4tz4)
- Binding mode in 4TZ4's paper: a hydrophobic pocket in CRBN's thalidomide-binding domain accommodates the **glutarimide** moiety; the **isoindolinone ring is solvent-exposed**. These drugs bind CRBN and promote recruitment of Ikaros (IKZF1) and Aiolos (IKZF3) to the E3 complex — [RCSB 4TZ4](https://www.rcsb.org/structure/4TZ4)
- **3WX1** — "Structure of the human Cereblon-DDB1-lenalidomide complex reveals basis for responsiveness to thalidomide analogs", an alternative CRBN–lenalidomide entry — [RCSB 3WX1](https://rcsb.org/structure/3wx1)
- **5FQD** — CRL4–CRBN ligase with lenalidomide at 2.45 Å, associated with CK1α degradation — listed in a ligand binding-site index for S-lenalidomide — [TTD binding-site entry](https://db.idrblab.net/ttd/data/target-ligand-binding-site/details/T27861-Ligand:LVY) **[UNVERIFIED — not confirmed against the RCSB entry]**

### Inferences

- **Best single control for the demo: 6WTO (1.74 Å) or 6VN8 (1.9 Å), JAK2 JH1 + baricitinib.** A single catalytic domain, high resolution, a drug-like non-covalent ATP-competitive ligand — exactly the regime docking is validated in. Redock the extracted baricitinib into the stripped receptor and report heavy-atom RMSD to the crystal pose. This is the structural analogue of the Open Targets "known-answer check".
- **Be careful with the COVID-19 narrative.** Baricitinib's approved COVID-19 use is as a JAK inhibitor, and the literature pairs it with JAK1/JAK2. Since there is apparently no JAK1–baricitinib structure, the honest wording is "we redock baricitinib into JAK2, the JAK family member for which a co-crystal exists" rather than implying a JAK1 result.
- **5LF3 is a trap for a 24-hour build.** A 28-mer assembly means a large download, a receptor-preparation step that must isolate the β5 (PSMB5) active site and its neighbouring subunit, and ambiguity about which of several equivalent sites to box. Additionally, bortezomib is a boronic-acid inhibitor that is generally described as forming a covalent adduct with the catalytic Thr1 — **[not verified in this research; verify before using]** — and **Vina and DiffDock both model non-covalent binding**, so a redocking RMSD here would be scoring the wrong physics. If multiple myeloma must have a structural control, prefer the CRBN–lenalidomide system.
- **4TZ4 is usable but soft**: 3.01 Å is low resolution for a redocking control, and the complex includes DDB1, so the receptor prep must keep the CRBN chain (chain C) and box on the TBD pocket. Check whether 3WX1 or 5FQD offers better resolution before committing.
- A good, cheap honesty device: **show both a positive control (redock the co-crystal ligand, expect low RMSD) and a negative control (dock an unrelated ligand into the same box, expect a worse score with a plausible-looking pose)**. The negative control is what makes the "a pose is not evidence" message land with judges.

### Gaps

- Resolution and ligand occupancy for 3WX1 and 5FQD were not retrieved; a 5-minute RCSB check should pick the best CRBN entry.
- Whether 6VN8 or 6WTO has the cleaner single-occupancy baricitinib and fewer alternate conformations was not checked.
- No source confirming bortezomib's covalent Thr1 adduct was located in this research.

## Which browser viewer — Mol*, 3Dmol.js or NGL — for a React app showing a protein plus multiple poses with a surface toggle?

### Takeaway

**3Dmol.js is the pragmatic hackathon choice**: permissive licence, an imperative React-free API that drops into a `useEffect`, built-in parallelised surface computation, and a much lighter bundle than Mol*. Mol* is the richest and is what the PDB itself ships, but brings its own app-shell and theming idioms; NGL is described in a 2026 evaluation as less actively maintained.

### Cited Findings

- A 2026 library evaluation for a dashboard app selected **3Dmol.js** over Mol* and NGL, citing **BSD-3-Clause licence, v2.5.x, actively maintained, an imperative React-free API, and one WebGL context per viewer**. It characterised **Mol*** as MIT-licensed and "the most feature-complete" but "a heavy bundle with its own app-shell/theming idioms", and **NGL** as less actively maintained — [depictio issue #978](https://github.com/depictio/depictio/issues/978)
- 3Dmol.js lists **parallelised molecular surface computation** among its features and describes its focus as the viewer library rather than a full toolkit — [3Dmol.js docs](https://3dmol.csb.pitt.edu/doc/index.html)
- Mol* **falls back to CPU surface calculation when GPU memory is likely insufficient** — [Mol* Web Molecular Graphics Engine, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13032908/)
- NGL supports **four surface representations, including van der Waals and solvent-excluded surfaces**, and is strong on file formats and representations — [NGL Viewer paper](https://www.researchgate.net/publication/275647707_NGL_Viewer_a_web_application_for_molecular_visualization), [uglymol MolecularViewers wiki](https://github.com/uglymol/uglymol/wiki/MolecularViewers)
- Mol* is widely adopted — by the PDB, UniProt and the AlphaFold DB — and is the most feature-rich of the three — [Mol* Viewer paper, PMC8262734](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8262734/)
- The uglymol comparison calls 3Dmol "lightweight with a well-documented API" — [uglymol wiki](https://github.com/uglymol/uglymol/wiki/MolecularViewers)

### Inferences

- **Recommended React integration (3Dmol.js):** one `<div ref>`, create the viewer inside `useEffect` with an empty dep array, keep the viewer instance in a `useRef` (never in state — it is not serialisable and will thrash renders), add the receptor as one model and each pose as a separate model so you can toggle them independently, then `viewer.zoomTo()` on the ligand selection. A surface toggle is `viewer.addSurface(...)` / `viewer.removeAllSurfaces()` gated by a boolean, and the one-WebGL-context-per-viewer property noted in the evaluation means you must dispose the viewer on unmount or a hot reload will leak contexts.
- Pose files map cleanly: **Vina → PDBQT → SDF via Meeko** ([Vina docs](https://autodock-vina.readthedocs.io/en/latest/docking_basic.html)) and **DiffDock writes SDF directly** ([gcorso/DiffDock](https://github.com/gcorso/DiffDock)), so a single SDF code path serves both back ends. Serve the receptor as PDB (or mmCIF if you later switch to Mol*).
- **Surfaces are the main performance risk.** Compute the surface only over residues near the pocket (a within-8-Å selection), not the whole protein, and make it opt-in behind the toggle. Mol*'s documented CPU fallback is a warning that surface generation is memory-hungry on modest GPUs — and judges will be watching on a laptop.
- Pick Mol* only if you need mmCIF-native handling, validation overlays or PDB-grade polish and have someone who already knows it. Do not learn Mol*'s state-tree API during a hackathon.

### Gaps

- No head-to-head benchmark of the three libraries on docking poses specifically was found; the comparison rests on one 2026 library evaluation plus the libraries' own papers and docs.
- No measured bundle-size figures for Mol* vs 3Dmol.js were located.

## What is the recommended primary path, fallback, time budget, structural control and honest wording?

### Takeaway

**Primary: AutoDock Vina 1.2.7 + Meeko running locally in the API process, with a pre-warmed cache for the two demo pairs. Fallback/upgrade: a hosted DiffDock NIM call on build.nvidia.com.** Do not make the DGX Spark a dependency; if you want the sponsor story, run Boltz-2 NIM on it as an optional, clearly-labelled extra. Everything in this section is engineering judgement built on the cited findings above, not a sourced recommendation.

### Cited Findings

- Vina is CPU-bound and multithreaded and ships an official `mac_aarch64` binary, so it runs natively on the team's Macs with no GPU and no driver work — [AutoDock-Vina releases](https://github.com/ccsb-scripps/AutoDock-Vina/releases), [STEM Skills Lab guide](https://stemskillslab.com/gromacs-autodock-vina-mac-apple-silicon/)
- Vina was the top performer on RMSD ≤ 2 Å **and** PB-valid in the paper that introduced the physical-validity test (58% on the benchmark set) — [alphaXiv summary of PoseBusters](https://www.alphaxiv.org/abs/2308.05777v3) — and was still at 58.1% in a Mar 2026 comparison — [bioRxiv 2026](https://www.biorxiv.org/content/10.64898/2026.03.25.714128v1.full)
- Full local prep + dock is a short, documented command chain: `pip install -U numpy scipy rdkit vina meeko gemmi prody`, then `mk_prepare_ligand.py -i lig.sdf -o lig.pdbqt`, then a Vina run with a defined box; Meeko converts results back to SDF with correct bond orders via the SMILES it embeds in the PDBQT header — [Vina basic docking tutorial](https://autodock-vina.readthedocs.io/en/latest/docking_basic.html)
- DiffDock's own README warns the confidence score "is not a binding affinity measure" — [gcorso/DiffDock](https://github.com/gcorso/DiffDock)
- Uni-Dock reaches ~0.10 s/ligand in fast mode and ~0.32 s in balanced mode with the Vina scoring function, but is designed for batches of ~1,000 ligands against one pocket — [Uni-Dock README](https://github.com/dptech-corp/Uni-Dock/blob/main/unidock/README.md), [Uni-Dock, J. Chem. Theory Comput.](https://pubs.acs.org/doi/abs/10.1021/acs.jctc.2c01145)
- GNINA 1.3 benchmarks on a 4-core i7-4790K + RTX 3080 under CUDA 12.2, averaging docking time over 100 PDBbind v2016 core complexes — [GNINA 1.3 paper](https://ora.ox.ac.uk/objects/uuid:df65eb31-2faf-4035-847b-d6ae4695538e/files/r6969z2176). A secondary summary claims CPU-only runtime improved from 129 s to 30 s per complex — [BiologyAIDaily on X](https://x.com/BiologyAIDaily/status/1898211196274459047) **[UNVERIFIED secondary source]**
- Chai-1 is Apache 2.0 for both code and weights and is explicitly usable commercially including for drug discovery; it needs Linux, Python 3.10+ and a bf16-capable CUDA GPU (A100 80GB / H100 80GB / L40S 48GB recommended; A10/A30 for smaller complexes; RTX 4090 reported working). Inputs are FASTA plus SMILES ligands; Pythonic inference returns a list of PDB files; PyPI version 0.6.1 — [chaidiscovery/chai-lab](https://github.com/chaidiscovery/chai-lab)
- OpenFold3 is Apache 2.0; NVIDIA's model card lists the NVIDIA Open Model License plus Apache 2.0 and states commercial use is permitted — [R&D World](https://www.rdworldonline.com/openfold3-debuts-as-apache-licensed-protein-co-folding-model-with-apheris-bringing-it-into-pharma-it/), [build.nvidia.com OpenFold3 model card](https://build.nvidia.com/openfold/openfold3/modelcard)
- The `posebusters` validity checks group into chemical validity/consistency, intramolecular validity and intermolecular validity — a runnable, citable sanity check on any generated pose — [alphaXiv summary](https://www.alphaxiv.org/abs/2308.05777v3)

### Inferences

**Recommended architecture (judgement, not sourced)**

A docking job is slow, failure-prone and produces files — so it must not live inside a request. The minimum robust shape for 24 hours:

1. `POST /api/dock` validates `(pdb_id, chain, ligand_smiles, box)`, computes a deterministic **cache key** = SHA-256 of (pdb_id, chain, canonical SMILES, box centre/size, engine, engine version, exhaustiveness, seed), inserts a `docking_job` row in Tiger Cloud Postgres with `status='queued'`, returns `202` + `job_id`. If the key already exists with `status='done'`, return it immediately — this is what makes the demo instant.
2. A **single worker process** (a `while True` loop polling `SELECT ... WHERE status='queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`) runs the dock. `FOR UPDATE SKIP LOCKED` gives you a correct queue in Postgres with no Redis, no Celery, no broker to debug at 4 a.m.
3. `GET /api/dock/{job_id}` returns `{status, progress_note, result_urls, error}`; the React app polls every 2 s. Server-Sent Events are nicer but polling never breaks behind a tunnel or a conference Wi-Fi proxy.
4. Results: write `receptor.pdb`, `poses.sdf`, `scores.json`, `log.txt` to object storage (Vultr Object Storage / S3-compatible) under `s3://bucket/{job_id}/`, store the URLs in the row. Keep Postgres for metadata and scores only — never blobs.
5. Hard **timeout** (e.g. 180 s) and a **per-session job cap**. On timeout or non-zero exit, set `status='failed'` with the stderr tail, and have the UI show the cached known-answer example instead of a spinner of death.
6. **Pre-seed the cache before judging** with the two demo pairs (baricitinib → 6WTO; lenalidomide → 4TZ4) plus the redocking control. Live compute is the feature; the cache is the insurance.

**Time budget for one person owning docking (~11 h of the 24, leaving slack)**

| Phase | Budget | Output |
|---|---|---|
| 0. Pre-event (do before the clock starts) | — | NVIDIA build.nvidia.com API key created and smoke-tested; Vina + Meeko + RDKit env installed and a hello-world dock completed |
| 1. Local Vina pipeline end-to-end on one hardcoded pair | 2 h | `dock(pdb_id, smiles, box) -> poses.sdf, scores.json` as a plain Python function |
| 2. Receptor prep + box-from-co-crystal-ligand helper | 1.5 h | Deterministic box centre; waters/ions/extra chains stripped |
| 3. Benchmark runtime on the actual Mac at exhaustiveness 8/16/32 | 0.5 h | A real number to design the UX around; pick the setting |
| 4. Redocking control + RMSD + `posebusters` check | 1.5 h | A number and a PASS/FAIL you can put on screen |
| 5. Job table, worker loop, status endpoint, object storage | 2 h | `202` + poll + result URLs |
| 6. 3Dmol.js viewer: receptor + N poses + surface toggle | 2 h | Working viewer in React |
| 7. Hosted-NIM fallback path behind a feature flag | 1 h | Second engine, same output contract |
| 8. Cache pre-seeding + demo rehearsal | 0.5 h | Nothing computes live for the first time on stage |

**Structural control to ship**

Run it as a first-class, visible feature, not a footnote: strip the co-crystallised baricitinib out of 6WTO, re-dock it into that same receptor with the same box and settings used for user jobs, compute **symmetry-corrected heavy-atom RMSD** to the crystal pose (spyrmsd is already an MIT-licensed DiffDock dependency — [gcorso/DiffDock](https://github.com/gcorso/DiffDock)), run the `posebusters` checks, and display "Redocking control: baricitinib into 6WTO, RMSD = X.X Å (success threshold 2.0 Å), PoseBusters: PASS". Add the negative control (an unrelated ligand into the same box) so the audience sees that the viewer will happily draw a confident-looking wrong answer.

**Honest wording to put in the UI (use close to verbatim)**

- Next to the pose: *"This is a predicted binding pose: a geometric hypothesis for how this molecule could sit in this pocket of this particular crystal structure. It is not evidence that the drug binds this target, and it is not a prediction of clinical effect."*
- Next to the score: *"The docking score is a rough, unitless estimate of fit. It is not a measured binding affinity, it does not convert reliably to Kd or IC50, and scores are only loosely comparable between different ligands."* For DiffDock specifically the repo itself says the confidence score "is not a binding affinity measure" — [gcorso/DiffDock](https://github.com/gcorso/DiffDock).
- Next to the control: *"We validate the pipeline by re-docking a ligand whose true position is known from the crystal structure. A low RMSD means our setup reproduces a known answer; it says nothing about the novel pairs you explore."*
- In the method note: *"Benchmarks that check physical validity as well as geometry (PoseBusters, Chem. Sci. 2024) found that no deep-learning docking method yet outperformed classical tools like AutoDock Vina; we report both RMSD and PoseBusters validity so you can see what was actually checked."* — [arXiv:2308.05777](https://arxiv.org/abs/2308.05777)
- Record and display the versions: Vina 1.2.7, Meeko x.y, **RDKit version** (a single RDKit bump halved DiffDock's reported performance — [BLOPIG](https://www.blopig.com/blog/2025/04/featurisation-is-key-one-version-change-that-halved-diffdocks-performance/)), PDB ID + chain, box centre/size, exhaustiveness, seed.

**Options to explicitly rule out for this hackathon (with reasons)**

- **DiffDock on DGX Spark** — no ARM64 NIM, unanswered forum question, and the PyTorch sm_121 class of silent hang.
- **Uni-Dock** — optimised for ~1,000-ligand batches against one pocket; the app docks one ligand, so the GPU setup buys nothing ([Uni-Dock README](https://github.com/dptech-corp/Uni-Dock/blob/main/unidock/README.md)).
- **GNINA** — strong method, but it is a from-source CUDA build with no DGX Spark evidence; only worth it if someone already has a working x86 GPU box with it installed.
- **AlphaFold 3** — licence and server limits unverified; it also re-predicts the protein rather than docking into the user's chosen structure.
- **Chai-1 / OpenFold3 / Protenix locally** — Chai-1's own README wants an A100/H100/L40S-class GPU ([chai-lab](https://github.com/chaidiscovery/chai-lab)); not a laptop path, and co-folding answers a different question than "dock this drug into this structure".

### Gaps

- The entire job-architecture and time-budget section is **engineering judgement**, not sourced; no authoritative source on hackathon docking-service architecture was sought or found.
- No measured end-to-end latency for the hosted DiffDock NIM (request → pose SDF) was found, so the fallback's demo-time behaviour is unquantified.
- Vultr Object Storage / Tiger Cloud specifics were not researched in this task.
- Boltz-2's affinity-prediction output format and whether the NIM exposes it were not confirmed; the Boltz-2 NIM support matrix does not mention affinity prediction or I/O formats — [support matrix](https://docs.nvidia.com/nim/bionemo/boltz2/latest/support-matrix.html).
- Protenix's licence: **no source found.**
