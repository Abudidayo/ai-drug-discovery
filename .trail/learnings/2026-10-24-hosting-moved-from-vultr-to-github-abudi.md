---
title: Hosting moved from Vultr to GitHub Codespaces; most free hosts ruled out
author: Abudi
date: 2026-10-24
branch: abdullah-nextverse/changes
cost: { minutes: 29, tokens: 261252 }
id: l-b8db09c3
scope: repo
status: active
src: agent
---

## Decided
Stream C hosting is GitHub Codespaces (4-core / 16 GB, free personal quota of 120 core-hours a month, no card), replacing the "Vultr CPU VM" row in plan.md §8 and the Vultr step in docs/build-reference.md §1. Set up the .devcontainer early to surface install and latency problems, then add compose and a public port 8000 once the first vertical slice works. plan.md itself is the team's to change; propose it in the PR.

## Tried and ruled out
- Vultr (24 Oct 2026): a new account is unverified until a payment method is linked. Every console page, including Settings/API, redirects to Billing, so neither API keys nor VMs are possible. Dropped because that was too slow; the MLH Vultr prize goes with it.
- Hugging Face Spaces: Docker and Gradio Spaces now need a paid PRO plan; only static Spaces are free.
- Render free (512 MB, 0.1 CPU): too small for the 360 MB distance matrix and Vina.
- Fly.io, Railway, Koyeb: trial-only or card. Oracle Always Free: card, scarce A1 capacity, allowance reportedly halved in June 2026.

## Watch out
- The gh tokens on this machine lack the `codespace` scope. Add it with `gh auth refresh -s codespace` for Abudidayo before using `gh codespace`.
- A codespace idles out after at most 240 min, and idleness counts editor or terminal activity, not HTTP traffic. Keep a tab attached during judging and pre-run the C9 docking cache.
- Codespaces egress IPs are not fixed, so a Tiger Cloud IP allow list would block it.
