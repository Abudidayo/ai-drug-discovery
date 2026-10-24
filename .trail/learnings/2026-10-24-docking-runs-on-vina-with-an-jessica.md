---
title: "Docking runs on Vina with an A40 or Mac, not Blackwell GPUs"
author: Jessica
date: 2026-10-24
cost: { minutes: 25, tokens: 8599 }
id: l-6a7657e0
scope: repo
status: active
touches:
  - docs/team-build-plan.md
  - docs/mvp-spec.md
---

## Ruled out by research
- Renting a B200 or B300. Vultr sells the B200 only as an 8-GPU node (about $68/hr, with no deployable location on 24 Oct 2026) and the B300 only through sales. DiffDock pins torch 1.13.1+cu117, which has no Blackwell kernels. A single dock needs little GPU anyway: NVIDIA's Boltz-2 benchmark has a B200 at 1.56 s against an L40S at 2.08 s.
- Docking on the DGX Spark (GB10, sm_121, aarch64). Open-source Boltz hangs silently there (jwohlwend/boltz#663, closed as not planned), and the DiffDock NIM support matrix has no GB10 or ARM64 entry.

## Watch out
- In PoseBusters, Vina had 58% of poses within 2 Å RMSD and physically valid, against DiffDock's 12% (308 complexes). Pin and show the RDKit version, because one RDKit bump roughly halved DiffDock's reported score.
- No JAK1–baricitinib crystal structure exists. Use JAK2 6WTO (1.74 Å) or 6VN8 and label the result as JAK2. Avoid 5LF3: the 20S proteasome is a 28-mer and bortezomib binds covalently. For myeloma, use 6O0K (BCL2 + venetoclax).
- On 24 Oct, Vultr London had only the A40 48 GB ($1.712/hr) and the A16 orderable. Whether the $100 MLH code covers GPUs is unverified.
