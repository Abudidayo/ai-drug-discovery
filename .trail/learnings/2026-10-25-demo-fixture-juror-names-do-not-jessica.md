---
title: Demo fixture juror names do not establish the selected live jury
author: Jessica
date: 2026-10-25
branch: Jessica-mak/website-design-exploration
id: l-c5e79980
scope: repo
status: active
---

## Decided
For the workflow Story / Technical design review, use the explicit jury selection in plan.md (25 Oct): openai-gpt-5.4, glm-5.3 and kimi-k3 with jury-v7. Label this as the team-selected configuration. Future production labels must read the displayed experiment's saved model configuration; pipeline/experiment.py takes live IDs from SNOWFLAKE_MODELS.

## Tried and ruled out
Do not infer current model choice from api/oxhack_api/fixtures/MONDO_0100096/experiment.json: that fictional UI fixture still names Claude Sonnet 5, GPT-5.4 and GLM-5.3 with jury-v3. The older data/a6/live_config.json is also a historical Opus/GPT/Kimi run. The juror bakeoff report recommends a Grok lineup under its frozen reliability rule, while the later explicit plan selects GPT/GLM/Kimi and discusses latency; a benchmark recommendation is not the chosen application configuration.

## Watch out
No active provider account or runtime environment was queried for the design. The selected model IDs have recorded pilot runs, but this does not prove they are the models serving a specific experiment. Preserve that distinction in user-facing statements. The optional docking worker source was verified on origin/abdullah-nextverse/workstream-c because worker/ is absent in this workspace checkout.
