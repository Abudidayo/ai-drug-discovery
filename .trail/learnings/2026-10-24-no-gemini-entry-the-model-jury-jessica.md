---
title: "No Gemini entry: the model jury is four Snowflake Cortex models"
author: Jessica
date: 2026-10-24
branch: Jessica-mak/hackathon-build-plan
cost: { minutes: 1, tokens: 12358 }
id: l-a32001bf
scope: repo
status: active
touches:
  - plan.md
---

## Decided
- The team is not entering MLH Best Use of Gemini API. Gemini is out of the build: the model jury is four models from one Snowflake account (claude-sonnet-5, openai-gpt-5.4, grok-4.7, llama3.1-8b), called through Cortex REST. That also fits the Snowflake prize's "many LLMs from one account" brief.
- Backtest jury calls are 50 diseases × 4 jurors × 2 conditions × 2 candidate orders = 800.

## Watch out
- The research notes and report still list Gemini as a cheap prize add-on and fallback juror. plan.md supersedes them. If Snowflake AI stays unavailable, point the same OpenAI-compatible client at any LLM API the team already has.
