---
title: plan.md diagrams render cleanly only without Mermaid subgraphs; check them with mermaid-cli and system Chrome
author: Jessica
date: 2026-10-24
branch: Jessica-mak/hackathon-build-plan
cost: { minutes: 2, tokens: 26103 }
id: l-94dc8231
scope: repo
status: active
touches:
  - plan.md
---

## Decided
- The infrastructure diagram in plan.md uses one node per external service and no `subgraph` blocks. Vultr is named in the node labels instead of a box.

## Tried and ruled out
- Grouping services in Mermaid `subgraph` clusters, with one edge per service or edges to the clusters themselves. The layout put clusters above the VM, and arrows crossed unrelated boxes. For example, API→data arrows ran through the jury box and looked like the jury calling the data APIs.

## Watch out
- GitHub renders the diagrams, but check them locally before pushing. Run `PUPPETEER_SKIP_DOWNLOAD=1 npx -y @mermaid-js/mermaid-cli@11 -i in.mmd -o out.png -p puppeteer.json`, where `puppeteer.json` sets `executablePath` to the installed Google Chrome. Without that setting, puppeteer downloads its own Chromium.
