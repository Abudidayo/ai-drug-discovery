---
title: "Jury pilot: models beat chance only when drug names are shown; blind they match chance"
author: Jessica
date: 2026-10-24
branch: Jessica-mak/stream-a
cost: { minutes: 26, tokens: 44484 }
id: l-32c85fa9
scope: repo
status: active
touches:
  - jury/client.py
  - jury/pilot.py
  - pipeline/panels.py
  - tests/jury/data/pilot_v2/v2_expanded_family.json
  - tests/jury/data/pilot_v2/v2_fgfr_range.json
  - tests/jury/data/pilot_v2/v2_map2k.json
  - tests/jury/test_pilot.py
  - tests/pipeline/test_panels.py
  - tests/jury/data/pilot_numeric/claude-opus-5-5.json
  - tests/jury/data/pilot_numeric/claude-sonnet-5.json
---

## Decided
- Jury pilot v2 (jury/pilot.py, pipeline/panels.py; outputs in data/pilot/v2/) used 6 Diseases with 2024 FDA approvals as true drugs: congenital adrenal hyperplasia (crinecerfont), biliary cirrhosis (seladelpar), COPD (ensifentrine), hypertension (aprocitentan), hyperhidrosis (sofpironium), low-grade glioma (tovorafenib). Each had 14 decoys, 7–8 of them acting on Disease-linked Targets, and was run with drug names shown and with names blinded. Keep these 6 and the v1 Diseases (RA, T2D, Parkinson) out of the final test.
- Named runs: Opus, GPT-5.4 and Kimi reach Hits@5 67% (MRR about 0.5–0.6). Blind runs: about chance (Hits@5 17–33%, MRR 0.11–0.20; chance is 33% and 0.22). The direct-evidence baseline scored 0%. Most of the named advantage comes from the model's own memory, not our evidence packet.

## Tried and ruled out
- Pilot v1 used famous true drugs (dexamethasone, canagliflozin, levodopa) and every model scored 100%. That was a ceiling effect from memorised indications; it can't separate models.

## Watch out
- The jury's numeric validator rejected digits inside names ("type 2 diabetes", BCL2) until it was fixed. Recheck the rejection tally before comparing models' valid-reply rates.
- Report the named vs blind gap with any jury result. The plan §6.3 leakage is real and measurable here.
