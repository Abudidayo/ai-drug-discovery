---
title: Mermaid diagrams here render cleanly only without subgraphs; check them with mermaid-cli and system Chrome
author: Jessica
date: 2026-10-24
branch: Jessica-mak/hackathon-build-plan
cost: { minutes: 1, tokens: 5333 }
id: l-187daf0a
scope: repo
status: active
replaces: l-94dc8231
touches:
  - plan.md
---

## Tried and ruled out
- Grouping services in Mermaid `subgraph` clusters for an infrastructure diagram. The layout put clusters in odd places and arrows crossed unrelated boxes, so the diagram implied connections that don't exist. One node per service, with no subgraphs, rendered cleanly.

## Watch out
- GitHub renders Mermaid, but check diagrams locally before pushing. Run `PUPPETEER_SKIP_DOWNLOAD=1 npx -y @mermaid-js/mermaid-cli@11 -i in.mmd -o out.png -p puppeteer.json`, where `puppeteer.json` sets `executablePath` to the installed Google Chrome. Without that setting, puppeteer downloads its own Chromium.
