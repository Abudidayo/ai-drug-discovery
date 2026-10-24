---
title: Docking runs AutoDock Vina on a CPU; no GPU is needed
author: Jessica
date: 2026-10-24
branch: Jessica-mak/hackathon-build-plan
cost: { minutes: 1, tokens: 5333 }
id: l-0597e0ad
scope: repo
status: active
replaces: l-6a7657e0
touches:
  - plan.md
  - docs/build-reference.md
---

## Decided
- Docking uses AutoDock Vina on a CPU worker (the Vultr CPU VM, or a Mac for testing), with prepared structures and cached results (plan.md section 7). The recipes are in docs/build-reference.md section 3.

## Tried and ruled out
- Renting a B200 or B300. Vultr sells the B200 only as an 8-GPU node and the B300 only through sales, DiffDock's pinned torch 1.13.1+cu117 has no Blackwell kernels, and one dock needs little GPU.
- Docking on the DGX Spark (GB10, aarch64). Open-source Boltz hangs silently there (jwohlwend/boltz#663), and the DiffDock NIM support matrix has no GB10 or ARM64 entry.

## Watch out
- In PoseBusters, Vina had 58% of poses within 2 Å RMSD and physically valid, against DiffDock's 12% (308 complexes). Pin and show the RDKit version.
- No JAK1–baricitinib crystal structure exists. Use JAK2 6WTO or 6VN8 and label the result as JAK2. Avoid 5LF3 (a 28-mer with covalently bound bortezomib). For myeloma, use 6O0K (BCL2 + venetoclax).
