# OxHack '26 sponsor technologies and partner prizes for a 24-hour drug-repurposing app

Research date: 24 Oct 2026 (day 1 of the event). Sources were read live today. These sources were JavaScript-rendered or protected by a Cloudflare challenge, so they were read in a real browser: the Devpost prize list and rules, the Snowflake Marketplace and the Vultr pricing page. Prize descriptions below are paraphrased, with one short verbatim quote. The exact wording is at the linked Devpost and MLH pages.

## What prizes are actually offered at OxHack '26, and what do they ask for?

### Takeaway
Devpost lists 13 non-cash prizes. Two are general (First Place, Runner Up). The rest are Hackathons UK "Hackiest Hack", a Citadel-backed "Best Handmade Prize", the HRT prize "[HRT] Best Use of Data for Predictions and Decision Making", seven MLH partner prizes (ElevenLabs, Gemini API, Solana, Tiger Data, Presage, Vultr, Snowflake API) and "Built with Delta". MLH's own page adds a DEV Writing Challenge worth $100. Auth0, GoDaddy Registry/.Tech, MongoDB, Arm, Cloudflare and DigitalOcean are **not** offered at this event. Only the Tiger Data, DEV and Delta prizes publish explicit judging criteria. The HRT prize's entire description is one line asking teams to make creative, effective use of data.

### Cited Findings
- Devpost's listing records "OxHack 2026" at the Mathematical Institute, organised by Oxford University. It runs Oct 24-25 2026 with themes "Beginner Friendly" and "Open Ended", 13 non-cash prizes and 0 cash prizes. — [Devpost hackathon API](https://devpost.com/api/hackathons?search=oxhack)
- Registration opens 9 AM on Saturday 24 October and the event is expected to finish at 4:30 PM on Sunday 25 October. It is open to UK university students aged 18+ (or within a year of graduating), with teams of up to 4, under the MLH Code of Conduct. — [OxHack '26 site](https://26.oxhack.net/)
- The Devpost rules page sets eligibility as an enrolled university student aged 18+. Projects are submitted on Devpost with a GitHub link. The "Prizes" section still says "To be announced" and the judging criteria section is empty. — [Devpost rules](https://oxhack-2026.devpost.com/rules)
- MLH lists the event as in-person in Oxford, Oct 24–25. Partners are ElevenLabs, Google Gemini, Solana, Tiger Data, Presage, Vultr, DEV and Snowflake. The "Sponsors" block lists MLH activities: Intro to Google AI Studio, Digi-key Hardware Lab, Gemini Demo and Hacking with GitHub Copilot. — [MLH event page](https://www.mlh.com/events/oxhack-26)
- **HRT prize:** "[HRT] Best Use of Data for Predictions and Decision Making", 1 winner. The only description is a one-sentence invitation to use creativity to make the best use of data. — [Devpost](https://oxhack-2026.devpost.com/)
- **First Place / Runner Up:** general prize categories, each with 1 winner, awarded by the OxHack Committee and guests. — [Devpost](https://oxhack-2026.devpost.com/)
- **[Hackathons UK] Hackiest Hack:** rewards a deliberately over-engineered, held-together-with-string build. The prize is shark plushes for each team member. — [Devpost](https://oxhack-2026.devpost.com/)
- **Best Handmade Prize:** judged by Tom 7, offered with thanks to Citadel. It asks for something creative built from scratch. — [Devpost](https://oxhack-2026.devpost.com/)
- **[MLH] Best Use of Snowflake API** (prize: Arduino Student Kit) invites teams to use industry-leading LLMs from a single account through the Snowflake APIs. It says AI can be added with a single curl to Snowflake's REST API. It suggests custom apps, RAG-powered chatbots or embedded AI features, and points to a special 120-day student trial and an example repo. — [Devpost](https://oxhack-2026.devpost.com/); [MLH event page](https://www.mlh.com/events/oxhack-26)
- **[MLH] Best Use of Tiger Data** (prize: Stream Deck Mini) pitches Tiger Data as PostgreSQL extended for real-time data, time-series metrics and complex analytics. It highlights four things: standard SQL, relational data and high-frequency metric streams side by side, real-time dashboards from pre-computed continuous aggregates, and 90%+ compression on free-tier instances. Example project types are IoT monitoring, AI-driven analytics dashboards and financial prediction engines. The winner is "The team that demonstrates the most innovative, impactful, and performance-driven use of Tiger Data". Forks, agents, MCP and "Agentic Postgres" are not mentioned. — [Devpost](https://oxhack-2026.devpost.com/)
- **[MLH] Best Use of Vultr** (prize: M5Stack Official Tab5) promotes one-click deployment, scalable cloud compute and Vultr Cloud GPUs for AI-driven apps. It asks teams to sign up, claim free credits and take their hack to the cloud. No judging criteria are stated. — [Devpost](https://oxhack-2026.devpost.com/)
- **[MLH] Best Use of ElevenLabs** (prize: wireless earbuds) is about natural, expressive AI voices. It asks teams to integrate autonomous audio experiences and give the project a voice. — [Devpost](https://oxhack-2026.devpost.com/)
- **[MLH] Best Use of Gemini API** (prize: MLH Swag Kits) asks for AI-powered apps built on the Gemini API. Its examples are a personalised-advice chatbot, an app that summarises complex research papers, and creative content or code generation. — [Devpost](https://oxhack-2026.devpost.com/)
- **[MLH] Best Use of Solana** (prize: Unruggable hardware wallets per member) suggests games and social apps with high-frequency transactions, trading/lending/DEX apps, or supply-chain, identity and payments prototypes. — [Devpost](https://oxhack-2026.devpost.com/)
- **[MLH] Best Use of Presage** (prize: Fitbit Inspire plus perks) uses camera-based sensing of a person's physical and emotional state: heart rate, breathing rate, engagement and facial expression via SDKs. The perks are free development-credit refills for 3 months and 30% off usage for the first year after going live. — [Devpost](https://oxhack-2026.devpost.com/); [MLH event page](https://www.mlh.com/events/oxhack-26)
- **Built with Delta:** use the Delta tool from ideation through testing and share Delta threads. Judging weights are Speed & Performance 30%, Technical Implementation 25% (clean code, sound architecture, use of Rust or collaboration features), Innovation 25%, and Polish & Usability 20%. Teams use OpenRouter tokens inside Delta. — [Devpost](https://oxhack-2026.devpost.com/)
- **DEV Writing Challenge** ($100, MLH page only): selections consider technical substance, originality, clear storytelling and community popularity. — [MLH event page](https://www.mlh.com/events/oxhack-26)
- MLH's organiser guide treats rules such as whether hackers may submit to multiple challenges as decisions for each event. The standard rules are optional for organisers. — [MLH organiser guide](https://guide.mlh.io/general-information/judging-and-submissions/rules-for-your-hackathon)

### Inferences
- The HRT prize title, "predictions and decision making", fits the app closely. The app turns evidence into a ranked, explained recommendation of which approved drug to investigate. To compete for it, the demo should foreground data-driven decision quality, not just the UI. That means quantitative jury agreement (for example Kendall's W or rank correlation), an explicit uncertainty or abstain state, the labelled baricitinib/COVID-19 known-answer check as a validation, and an evidence trail per claim. (Inference)
- All 13 Devpost prizes are non-cash. Since only the Tiger, Delta and DEV prizes publish criteria, judges of the other prizes (including HRT) will likely weigh demo clarity and a working end-to-end flow. (Inference)
- Integrating Auth0, .Tech domains, MongoDB, Arm, Cloudflare or DigitalOcean wins nothing at OxHack '26, because none of them are offered. (Inference from the prize lists)

### Gaps
- No judging criteria or rubric are published for First Place, Runner Up or the HRT prize.
- I found no OxHack rule on whether one team can win more than one MLH prize. The Devpost rules page says prizes are "To be announced" and does not address it.
- The MLH page's timestamps (Sat Oct 24 1:11 AM – Sun Oct 25 9:00 PM UTC) don't match the OxHack site's local schedule (9 AM Saturday to about 4:30 PM Sunday). The real submission deadline should be confirmed on site.

## Snowflake: Cortex AI functions, models (Oct 2026), regions, trial limits, Search/Analyst/Agents, Streamlit, SPCS GPUs, Marketplace data, and what the prize asks for

### Takeaway
The MLH Snowflake prize is literally about calling many LLMs from one Snowflake account through its REST API, so the planned "model jury" is on-message. The Cortex REST API's OpenAI-compatible Chat Completions endpoint serves 40 models: Claude, OpenAI GPT, Llama 3.1 8B, plus preview Grok, GLM and Kimi. **Gemini is not on the REST list**, and Mistral, Llama 3.1 70B and Llama 4 Maverick are "Legacy", so a brand-new account cannot start using them. Gemini, Llama 3.3 70B, Mistral Large 3 and Qwen3 are reachable through SQL `AI_COMPLETE` instead. The largest operational risk is that Snowflake disables AI features on self-service trials until a credit card is added. Trials also have no external network access, which rules out calling Open Targets from inside Snowflake and makes docking in Snowpark Container Services impractical for a 24-hour build.

### Cited Findings
**Prize and access**
- The MLH partner page offers a free 120-day trial (sign-up at mlh.link/snowflake-signup). It recommends Cortex AI Studio, the Cortex Code CLI (an AI coding assistant), "Free Snowflake Datasets" and the Snowflake REST APIs, plus an example repo for a roughly 5-minute chat app. It states no credit amount, card requirement, edition or region. — [MLH Snowflake partner page](https://www.mlh.com/partners/snowflake)
- `mlh.link/snowflake-signup` redirects to `signup.snowflake.com/?trial=student&utm_source=mlh&...&k=snowflake-ai-mlh&t=...`, a student-trial flavour of the signup form. `mlh.link/snowflake-tutorial` redirects to the GitHub repo `annafil/cortex-rest-api-demo`. — [mlh.link/snowflake-signup](https://mlh.link/snowflake-signup); [mlh.link/snowflake-tutorial](https://mlh.link/snowflake-tutorial)
- The MLH tutorial creates a Personal Access Token (PAT) as the API key and tells hackers to set a network-policy exception. It then calls `.../api/v2/cortex/inference:complete` with model `claude-3-5-sonnet` and says the API is compatible with OpenAI's spec. — [annafil/cortex-rest-api-demo README](https://github.com/annafil/cortex-rest-api-demo)
- Trial sign-up needs only a valid email, with no payment information. However, **AI features are disabled by default on self-service trial accounts until a credit card is added**. Adding a card neither upgrades the account nor ends the trial. A standard trial lasts 30 days or until the free balance runs out. Trials cannot use external network access, hybrid tables, outbound private connectivity, Openflow or Duo MFA. — [Snowflake docs: Trial accounts](https://docs.snowflake.com/en/user-guide/admin-trial-account)
- Search snippets (pages not opened) give conflicting figures. Snowflake's university FAQ describes standard trials as up to $400 of usage or 30 days. A 2023 blog described an expired 120-day/$400 hackathon trial. — [Snowflake University FAQ (snippet)](https://learn.snowflake.com/en/pages/university-faqs); [UseReady blog (snippet)](https://www.useready.com/blog/get-snowflake-free-for-120-days-how-to-extend-your-trial-period)

**AI functions, structured outputs, tools**
- Cortex AI Functions are AI_COMPLETE, AI_CLASSIFY, AI_FILTER, AI_AGG, AI_EMBED, AI_MULTI_EMBED, AI_EXTRACT, AI_SENTIMENT, AI_SUMMARIZE, AI_SUMMARIZE_AGG, AI_SIMILARITY, AI_TRANSCRIBE, AI_PARSE_DOCUMENT, AI_REDACT and AI_TRANSLATE, with helpers TO_FILE, AI_COUNT_TOKENS and PROMPT. Some individual functions are Preview, but the overview page doesn't say which. — [Snowflake docs: Cortex AI Functions](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql)
- AI_AGG reduces a column of text using a natural-language instruction. Unlike COMPLETE or AI_SUMMARIZE, it handles datasets larger than a model's context window. It runs on a Snowflake-managed model with 128K tokens per row and 8,192 output tokens. — [Snowflake docs: AI_AGG](https://docs.snowflake.com/en/sql-reference/functions/ai_agg); [Models and regional availability](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-regional-availability)
- AI_COMPLETE accepts a `response_format` given either as a JSON schema or as a SQL type literal. For OpenAI (GPT) models the schema has extra requirements, including that the `required` field be present. — [Snowflake docs: AI_COMPLETE structured outputs](https://docs.snowflake.com/en/sql-reference/functions/ai_complete-structured-outputs)
- The Cortex REST API offers three endpoints, all sharing one authentication method, model catalogue and set of rate limits:
  - Chat Completions (`/api/v2/cortex/v1/chat/completions`), OpenAI-compatible, labelled as supporting all model families (OpenAI, Claude, Llama, Mistral, DeepSeek, Snowflake).
  - Messages (`/api/v2/cortex/v1/messages`), Anthropic-compatible, Claude only.
  - Responses (`/api/v2/cortex/v1/responses`, preview), OpenAI models only.

  The OpenAI SDK works by setting `base_url` to `https://<account>.snowflakecomputing.com/api/v2/cortex/v1` and using the PAT as the API key. — [Snowflake docs: Cortex REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api)
- Both the Chat Completions and Messages APIs support structured output: `response_format` with `{"type":"json_schema", ...}`. Tool calling works for OpenAI and Claude models. Prompt caching uses a 5-minute TTL for Anthropic models and is implicit for OpenAI. — [Snowflake docs: Cortex REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api)

**Models available in Oct 2026**
- The docs name `claude-opus-5` and `gemini-3.1-pro` as Cortex's most capable models.
  - Large: `claude-opus-5-5` (Public Preview, 1M context, needs cross-region), `claude-opus-5`, `claude-opus-4-8`, `gemini-3.1-pro` (Public Preview, needs cross-region).
  - Medium: `claude-sonnet-5-5` (Preview), `claude-sonnet-5` (1M context, 64K output), `llama3.3-70b` (128K).
  - Small: `claude-haiku-4-5`, `openai-gpt-5-mini` (needs cross-region), `llama3.1-8b`, `mistral-7b`.
  - The AI_COMPLETE limits table also lists the OpenAI GPT-5.x and 4.1 models, `gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `grok-4.7`, `glm-5.3`, the `qwen3-*` models, `mistral-large3`, `mistral-large2`, `mixtral-8x7b`, `llama4-maverick`, `llama3.1-70b`.

  — [Snowflake docs: Models and regional availability](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-regional-availability)
- **Models the REST API serves (40):**
  - Claude: opus-5-5 (Public preview), opus-5, opus-4-8, opus-4-7, opus-4-6, opus-4-5 (GA), fable-5-1 and fable-5 (Private preview), sonnet-5 (GA), sonnet-5-5 (Public preview), sonnet-4-6, sonnet-4-5 (GA), haiku-5-5 (Public preview), haiku-4-5 (GA).
  - OpenAI: gpt-6-astra (GA), gpt-6-luna, gpt-6-sol and gpt-6.1-sol (Public preview), gpt-5.6-luna, gpt-5.6-sol and gpt-5.6-terra (GA), gpt-5.5 (Private preview), gpt-5.4, gpt-5.2, gpt-5.1, gpt-5, gpt-5-mini, gpt-5-nano (GA), gpt-4.1 (Legacy).
  - Others: llama4-maverick (Legacy), llama3.1-8b (GA), llama3.1-70b (Legacy), deepseek-v4-flash (Private preview), glm-5.3, kimi-k3 (Public preview), mistral-7b and mistral-large2 (Legacy), grok-4.7 and grok-4.6 (Public preview), snowflake-decision-fast (Private preview).

  No Gemini model appears on the REST page at all. — [Snowflake docs: Cortex REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api)
- Legacy rule: after a model's legacy date, an account that never used it cannot start using it. Calls naming it fail. Private-preview models work only for accounts Snowflake has explicitly enabled. — [Snowflake docs: Models and regional availability](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-regional-availability); [Cortex REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api)
- DeepSeek is only private preview (`deepseek-v4-flash`). `deepseek-r1` appears only in the REST rate-limit table. "Arctic" survives only as embedding models (`snowflake-arctic-embed-*`) and `arctic-extract` for AI_EXTRACT. No Arctic chat LLM is listed for AI_COMPLETE. — [Models and regional availability](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-regional-availability); [Cortex REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api)
- Conflict: the regional-availability table marks `openai-gpt-6-astra` and the `gpt-5.6-*` models as private preview (\*\*), while the REST page marks them GA. `openai-gpt-5.4` is GA on both pages. — [Models and regional availability](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-regional-availability) vs [Cortex REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api)

**Regions and cross-region inference**
- Cross-region inference is controlled by the account parameter `CORTEX_ENABLED_CROSS_REGION`. `ANY_REGION` gives the broadest model set. The alternatives are `AWS_US`, `AWS_EU`, `AWS_APJ`, `AWS_JP`, `AWS_AU`, `AZURE_US`, `AZURE_EU`, `GCP_US` and `DISABLED`. New accounts in new organisations in commercial regions created after March 9, 2026 default to `ANY_REGION`. Only ACCOUNTADMIN can change it, e.g. `ALTER ACCOUNT SET CORTEX_ENABLED_CROSS_REGION = 'ANY_REGION';`. — [Snowflake docs: Cross-region inference](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cross-region-inference)
- Cross-region reach by model family:
  - OpenAI models are reachable only via Cross Cloud (Any Region) or the Azure scopes.
  - Gemini models only via Cross Cloud (Any Region), with `gemini-3.8-flash` and `gemini-4-argon` also in Google Cloud US.
  - The AWS EU scope covers the Claude family, `llama3.3-70b`, `llama3.1-8b` and legacy Mistral/Mixtral, but not GPT, Gemini, Grok or `mistral-large3`.
  - AI_AGG is listed for the AWS US/EU/APJ/JP and Azure US/EU cross-region scopes but not under "Cross Cloud (Any Region)".

  — [Models and regional availability](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-regional-availability)
- Native European availability:
  - AWS Europe West 2 (London) natively hosts `claude-sonnet-4-6` and `claude-opus-4-6`. London has no native AI_AGG, Llama or Mistral.
  - Frankfurt, Ireland and Azure West Europe natively host `llama3.1-8b`, legacy Llama 3/Mistral models, AI_AGG, AI_CLASSIFY, AI_FILTER and others.
  - In Ireland, `llama3.1-8b` is capped at a 16,384-token context and `mistral-7b` at 4,096.

  — [Models and regional availability](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-regional-availability)

**Rate limits and cost**
- REST rate limits apply per account and separately per model. Exceeding them returns HTTP 429, and teams should retry with exponential backoff. Example defaults (TPM / RPM):
  - `claude-sonnet-4-6`: 6,000,000 / 10,000
  - `claude-haiku-4-5`: 5,000,000 / 10,000
  - `claude-opus-4-6`: 3,000,000 / 10,000
  - `openai-gpt-5`: 600,000 / 600, rising to 1,000,000 / 10,000 with cross-region
  - `openai-gpt-5.2`: 1,200,000 / 3,000
  - `llama3.1-8b`: 800,000 / 800
  - `mistral-large2`: 600,000 / 200

  The table lists 16,384 max output tokens. Limits can be viewed in `SNOWFLAKE.ACCOUNT_USAGE.CORTEX_REST_API_RATE_LIMIT_POLICIES`. The table appears partly stale: it lists `deepseek-r1`, `llama3.1-405b` and `claude-4-sonnet`, none of which are in the current model list, and omits the 5.x-generation models. — [Snowflake docs: Cortex REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api)
- Cortex AI Functions are billed per token, at credits per million tokens set in the Snowflake Service Consumption Table. AI_COMPLETE bills both input and output tokens. Snowflake recommends warehouses no larger than MEDIUM for AI functions. — [Snowflake docs: Cost considerations](https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-cost)

**Cortex Search / Analyst / Agents, Streamlit, SPCS**
- The 2026 Cortex docs index includes Cortex Agents (REST API, Run API, Compact API, MCP connectors, code execution tool, evaluations, versioning), Cortex Search (including batch search), Cortex Analyst (REST API) and a Cortex Agent SDK quickstart. — [Snowflake Cortex docs index](https://docs.snowflake.com/en/user-guide/snowflake-cortex/llms.txt)
- A Streamlit in Snowflake app can reach outside services only through an External Access Integration set on the app. — [Snowflake docs: External network access in Streamlit](https://docs.snowflake.com/en/developer-guide/streamlit/features/external-access). External network access is not available on trial accounts. — [Trial accounts](https://docs.snowflake.com/en/user-guide/admin-trial-account)
- Snowpark Container Services is available in AWS, Azure and GCP commercial regions, except some government regions. GPU support is described for compute-intensive AI/ML jobs. — [Snowflake docs: SPCS overview](https://docs.snowflake.com/en/developer-guide/snowpark-container-services/overview)
- AWS GPU instance families:
  - `GPU_NV_S`: 1x A10G 24 GB, 6 vCPU, 28 GiB. Not available in ap-southeast-1, eu-central-2, eu-west-3 or ap-northeast-3.
  - `GPU_NV_M`: 4x A10G.
  - `GPU_NV_L`: 8x A100. US regions only; elsewhere on request.
  - `GPU_L40S_G1_8` / `_16`: 1x L40S 48 GB. Available only in us-east-1, us-east-2, us-west-2, eu-central-1, eu-north-1, ap-northeast-1 and ap-northeast-2, with a node limit of 5.
  - `GPU_R6K_*`: RTX PRO 6000 96 GB. US and Tokyo only.

  Pricing is in the Service Consumption Table. — [Snowflake docs: AWS instance families](https://docs.snowflake.com/en/developer-guide/snowpark-container-services/instance-families-aws)

**Snowflake Marketplace (searched live)**
- A "ChEMBL Bioactivity & Drug Discovery" listing by The Data Developers LLC is "Free to try" and "Instantly accessible". Its tables are SAMPLE_MOLECULE_DICTIONARY, SAMPLE_TARGET_DICTIONARY, SAMPLE_ASSAYS, SAMPLE_ACTIVITIES, SAMPLE_DRUG_MECHANISM, SAMPLE_DRUG_INDICATION, SAMPLE_DRUG_WARNING and others. — [Snowflake Marketplace search: chembl](https://app.snowflake.com/marketplace/data-products/search?search=chembl)
- DrugBank listings:
  - "Drug Vocabulary": Free.
  - "Biomedical Knowledge": Free to try, described as for precision medicine, drug repurposing and discovery.
  - "Drug Target Identification": a free-to-try subset covering 16,558 drugs and 19,535 targets, with ADMET properties.
  - "Clinical Trials & Rare Disease": Free to try.

  — [Snowflake Marketplace search: chembl](https://app.snowflake.com/marketplace/data-products/search?search=chembl); [search: open targets](https://app.snowflake.com/marketplace/data-products/search?search=open+targets)
- Snowflake publishes a free, "Cortex AI-ready" "PubMed Biomedical Research Corpus" (PubMed Central articles for Cortex AI apps). Third-party listings cover FAERS pharmacovigilance signals and drug-safety and clinical-trial risk. — [Snowflake Marketplace search: open targets](https://app.snowflake.com/marketplace/data-products/search?search=open+targets); [search: chembl](https://app.snowflake.com/marketplace/data-products/search?search=chembl)
- Searching "open targets" returned no Open Targets Platform listing; the 80 results were unrelated or generic. — [Snowflake Marketplace search: open targets](https://app.snowflake.com/marketplace/data-products/search?search=open+targets)

### Inferences
- **Jury design that works on a fresh account (Inference):**
  - Run the jury through REST Chat Completions with the OpenAI SDK and `response_format` JSON schema. Each juror returns a rank, a 0-1 score, a short rationale and cited evidence IDs.
  - Pick jurors from different vendors that a new account can call: `claude-sonnet-5` (GA), `openai-gpt-5.4` (GA on both pages), one public-preview "outsider" (`grok-4.7`, `kimi-k3` or `glm-5.3`), and `llama3.1-8b` as a deliberately small baseline.
  - Avoid Mistral and Llama-70B on REST: they are Legacy, so a new account can't call them.
  - For Gemini, Llama 3.3 70B or Mistral Large 3, call SQL `AI_COMPLETE` through the Snowflake SQL API (also a REST API), or call Gemini directly via Google (see the Gemini section).
- Use the current endpoints, not the MLH tutorial's: its `inference:complete` endpoint and `claude-3-5-sonnet` model are not in the 2026 model list, so the example would likely need editing. (Inference)
- **Trial risk mitigation (Inference):** in hour 0, sign up through the MLH student link and immediately test `AI_COMPLETE` and a REST call. If AI is disabled, add a card, which per the docs doesn't end the trial, or find a sponsor mentor. Confirm `SHOW PARAMETERS LIKE 'CORTEX_ENABLED_CROSS_REGION' IN ACCOUNT;` shows `ANY_REGION`.
- **Region (Inference):** with `ANY_REGION`, all models are reachable from any region.
  - If AI_AGG (consensus summary of juror rationales) is wanted, pick AWS US West 2/US East 1 or Frankfurt/Ireland, where AI_AGG is native.
  - London gives native Claude 4.6 but relies on cross-region for AI_AGG, which isn't listed under Any Region. Do aggregation in app code if unsure.
- Fetch Open Targets, ChEMBL, PubChem and RCSB data in the team's own backend and pass compact evidence into Cortex prompts. Trials have no external access, so neither Streamlit in Snowflake nor Snowpark can call those APIs. That also makes Streamlit in Snowflake a poor host for the main UI, especially with a custom 3D pose viewer. (Inference)
- **Don't run docking in SPCS during the hackathon (Inference).** It needs image push to the Snowflake registry, compute-pool setup and an unknown trial GPU eligibility and credit burn. With no egress on trials, DiffDock weights would have to be baked into the image. A10G (24 GB) or L40S (48 GB) would be adequate hardware, but the setup risk is high.
- The Marketplace ChEMBL listing appears sample-only (SAMPLE_ tables) and third-party, so the live ChEMBL API is the better primary source. A cheap "Snowflake-native" stretch goal that matches the prize's RAG wording: a literature panel over the free Snowflake PubMed corpus using Cortex Search. (Inference)
- Realistic setup time is 30-60 min to the first successful REST call (signup, email activation, PAT, network policy, account identifier, possibly a card), plus about 1-2 h for the jury harness with schema validation and agreement metrics. The harness is core work anyway. (Inference)

### Gaps
- Credit amount, edition options and whether AI features are enabled without a card on the MLH student trial (`trial=student`, `k=snowflake-ai-mlh`). The docs describe only self-service trials.
- Per-model credit prices: the Service Consumption Table PDF was not fetched.
- Whether SPCS GPU compute pools are allowed on trial accounts, and their credit rates.
- Whether Gemini can be reached through any REST endpoint. The REST page lists none, so I infer it can't.
- Whether AI_AGG works under `ANY_REGION` from London.
- Which individual AI functions are still preview.
- Whether PubChem is on the Marketplace (not searched).
- Access terms and limits of "Free to try" listings, and DrugBank licence terms for display in an app.
- Cortex Search, Analyst and Agents pricing and trial availability were not reviewed.

## Tiger Data: free tier and trial terms, extensions, forks, Tiger CLI/MCP/agent features, and what the prize rewards

### Takeaway
The MLH offer is Tiger Cloud's standard 30-day, $1,000-credit trial with no credit card. Every plan also includes two free (beta) services in us-east-1 with copy-on-write zero-copy forks that create in about 30-90 seconds. The prize text rewards innovative, impactful, performance-driven use and highlights time-series, continuous aggregates, compression and mixing relational data with metric streams. **It doesn't mention forks or agents**, so the team's no-forks plan is fine. To score, model experiment history as hypertables with a continuous aggregate.

### Cited Findings
- The MLH partner page says new sign-ups get $1,000 in complimentary credits valid for 30 days via mlh.link/tigerdata-quickstart. Resources listed: Quick Start, Tutorials, Glossary, "Tiger CLI and Tiger MCP", Hypertables, Hypercore and Migrate. — [MLH Tiger Data partner page](https://mlh.com/partners/tigerdata)
- `mlh.link/tigerdata-quickstart` redirects to Tiger's "quickstart in 5 minutes" page. A service is ready in a few seconds. The downloaded config file is the only time the service password is shown. Connection is by `psql "<service-url>"` or the console SQL editor. — [mlh.link/tigerdata-quickstart](https://mlh.link/tigerdata-quickstart); [Tiger quickstart](https://www.tigerdata.com/docs/get-started/quickstart/quickstart-5-minutes)
- Tiger's docs describe the trial as $1,000 of credit for 30 days. One email can create only one project. — [Tiger docs (llms-full dump, members/projects page)](https://www.tigerdata.com/docs/llms-full.txt)
- Pricing:
  - Performance starts at $30/month, billed hourly: 4 services, up to 8 CPU / 32 GB and 16 TB per service, PITR 3 days.
  - Scale starts at $36/month: unlimited services, up to 32 CPU / 128 GB, PITR 14 days.
  - Enterprise is custom.

  The page offers a free 30-day trial with no credit card. — [Tiger Data pricing](https://www.tigerdata.com/pricing)
- Free services run PostgreSQL with TimescaleDB and vector extensions. They have preset CPU and memory, are hosted in **us-east-1**, and exclude connection pooling, replication, data tiering, exporters, metrics and VPC. A free service goes read-only at its storage limit. Free services are in beta, and two are included on all plans. — [Tiger docs (llms-full dump, services overview and pricing pages)](https://www.tigerdata.com/docs/llms-full.txt)
- Forks:
  - Strategies are `now`, `last-snapshot` and `timestamp`.
  - Free services fork in about 30-90 s using copy-on-write storage with zero-copy between fork and parent.
  - Standard services fork in about 5-20+ min via backup restore and WAL replay.
  - With copy-on-write you pay only for chunks that diverge.
  - A free service can fork to free or standard, but a standard service can't fork to free.

  — [Tiger docs (llms-full dump, fork-services page)](https://www.tigerdata.com/docs/llms-full.txt)
- Tiger Cloud AWS regions include eu-central-1 (Frankfurt), eu-west-1 (Ireland) and **eu-west-2 (London)**. Azure germanywestcentral (Frankfurt) was added June 24, 2026, and a Europe (Zurich) region on February 11, 2026. — [Tiger docs (llms-full dump, regions)](https://www.tigerdata.com/docs/llms-full.txt); [Tiger changelog](https://www.tigerdata.com/docs/about/latest/changelog)
- Extensions: `pg_textsearch` (BM25), `pgvector` and `pgvectorscale` are available but not enabled by default (`CREATE EXTENSION`). `timescaledb` and `timescaledb_toolkit` are enabled by default. — [Tiger docs (llms-full dump, extensions page)](https://www.tigerdata.com/docs/llms-full.txt)
- Recent changelog:
  - pg_textsearch 1.5.1 (Oct 9, 2026).
  - Tiger CLI 0.26 (Oct 1, 2026): service metrics, and `tiger service fork` now forks at the current state by default. The deprecated `ai` add-on was removed.
  - TimescaleDB 2.30 (Sep 22, 2026).
  - CLI 0.25 (Sep 21): `service_rename`/`service_delete` MCP tools, plus an `environment` parameter on create and fork.
  - CLI 0.24 (Sep 9): `tiger db query`, device-code login, and the MCP tool `db_execute_query` renamed `db_query`.
  - CLI 0.23 (Sep 1): read-only modes.
  - PostgreSQL 15 dropped in TimescaleDB 2.28/2.29 (July/August 2026).
  - Live migration removed (Jul 24, 2026).

  The Free plan appears only in an Oct 24, 2025 entry. — [Tiger changelog](https://www.tigerdata.com/docs/about/latest/changelog)
- Tiger MCP ships inside the `tiger` CLI binary and shares its login.
  - CLI: `tiger service create|fork|list|get|resize|start|stop|logs|rename|delete`, `tiger db query|psql|schema|uri`.
  - MCP tools: `service_create`, `service_fork`, `db_query`, `db_schema`, `search_docs`, `view_skill` and more.
  - It auto-configures for claude-code, cursor, windsurf, codex, gemini, vscode, antigravity and kiro-cli.

  — [Tiger CLI and MCP](https://www.tigerdata.com/docs/learn/tiger-cli-mcp)
- **Ghost** (GA June 9, 2026) is Tiger Data's agent-oriented Postgres service, built on the same foundation as TimescaleDB, with fast forking and access via CLI or MCP. Its free tier is 100 compute hours/month and 1 TB storage, and a dedicated tier starts at $10/month. — [SD Times](https://sdtimes.com/data/tiger-data-launches-ghost-a-purpose-built-database-service-for-the-agentic-er/)
- Search snippets of the October 2025 "Agentic Postgres free plan" launch (not confirmed on the opened pages) mention 750 MB per free service, two free services, us-east-1 only, and the pgvectorscale and pg_textsearch extensions. — [Tiger blog (snippet)](https://tigerdata.com/blog/introducing-agentic-postgres-free-plan-experiment-ai-on-postgres)

### Inferences
- **Fit (Inference):** the prize copy reads like an analytics and time-series brief, not an agents or forks brief. Model the app's history to match it:
  - a `runs` hypertable (time, disease, target, drug, structure, docking engine, score, runtime)
  - a `jury_votes` hypertable (time, run, model, rank, score, latency, tokens)
  - one continuous aggregate (e.g. per-drug consensus and agreement over runs, or a model-agreement leaderboard) feeding a "history and leaderboard" panel
  - compression on the vote table

  Show query timings in the demo to speak to "performance-driven". pgvector is optional, for example "find similar past experiments" over rationale embeddings.
- Forks are not required by the prize. Skip them, or add at most a 10-minute "what-if" sandbox demo, since free-service forks take only about 30-90 s, and only if ahead of schedule. (Inference)
- Use the trial in **eu-west-2 London** for low latency and full features. The $1,000 credit far exceeds needs, and no card is needed. Free services also work but are us-east-1 only, beta, and storage-capped. (Inference)
- Stick with Tiger Cloud rather than Ghost, because the MLH resources and prize copy point to Tiger Cloud features. Whether Ghost counts for the prize is unverified. (Inference)
- Realistic setup is 10-20 min to a running database and connection string. Schema, hypertables, the continuous aggregate and a history UI panel take about 1-2 h. (Inference)

### Gaps
- Exact 2026 free-service storage and compute caps. The 750 MB figure comes from a 2025 snippet only.
- Whether the MLH $1,000/30-day credit differs at all from the standard trial.
- Whether pgai and its vectorizer are still supported. CLI 0.26 removed the deprecated `ai` add-on, yet an MCP tool description still says the Free plan includes it.
- How MLH judges weigh forks or agents in practice (the prize text is silent).
- Whether Ghost would qualify as "Tiger Data" for the prize.

## Vultr: GPU types, prices, London/EU regions, MLH credits, time to a Docker GPU box, and suitability for DiffDock/GNINA/Vina or hosting

### Takeaway
MLH hackers get **$100** of Vultr credit through a promo code. On 24 Oct 2026, Vultr's public API showed **A40 48 GB ($1.712/hr) and A16 16 GB ($0.471/hr) Cloud GPU plans orderable in London (lhr)** and Frankfurt. The L40S, GH200, H100 and B200 plans are priced but returned no deployable locations. $100 buys about 58 hours of an A40, enough for the whole event plus a small web VM. Hosting the docking worker on a Vultr GPU (and optionally the web app on Vultr) is the most on-message use for the prize.

### Cited Findings
- **MLH offer:** $100 in credits.
  1. Register at mlh.link/vultr-discover to receive a promo code. Students enter their school as "Company" and "Student" as job title.
  2. Verify the email.
  3. Create an account at vultr.com/register.
  4. Enter the code under Billing → Gift Code.

  Multiple registrations are not allowed, and Vultr's ToS and AUP apply. — [MLH Vultr partner page](https://www.mlh.com/partners/vultr); [mlh.link/vultr-discover → discover.vultr.com/mlh](https://discover.vultr.com/mlh)
- Vultr's MLH landing page says every hacker gets free credit for use during their event and mentions GPU-backed infrastructure. It states no amount, expiry, card requirement or product exclusions. — [discover.vultr.com/mlh](https://discover.vultr.com/mlh)
- **Cloud GPU on-demand pricing, billed hourly, from the pricing page on 24 Oct 2026:**
  - A16: 1x 16 GB, 6 vCPU, 60 GB RAM at $0.471/hr; 2x 32 GB at $0.942/hr.
  - A40: 1x 48 GB, 24 vCPU, 120 GB RAM at $1.712/hr; 4x at $6.849/hr.
  - L40S: 1x 48 GB, 16 vCPU, 180 GB RAM at $1.671/GPU/hr (also 2x, 4x, 8x).
  - GH200: 1x 96 GB, 72 vCPU, 480 GB RAM at $1.990/GPU/hr.
  - PCIe A100: 1x 80 GB, 12 vCPU, 120 GB RAM at $2.397/hr.
  - HGX A100: 8x at $2.800/GPU/hr.
  - HGX H100: 8x 80 GB at $2.300/GPU/hr.
  - HGX B200: 8x at $3.500/GPU/hr.
  - AMD MI300X / MI325X / MI355X: $1.850 / $2.000 / $2.590 per GPU/hr.
  - B300, GB300 NVL72 and MI455X: contact sales.

  — [Vultr pricing](https://www.vultr.com/pricing/#cloud-gpu)
- Vultr says GPU VMs or bare metal can be provisioned on demand in minutes, and that Vultr Clusters need no special requests or reservations. Bare-metal "starting from" GPU prices are per GPU-hour for pre-paid contracts (e.g. GH200 $1.990, 8x L40S $0.848, HGX A100 $1.490). On-demand bare-metal prices are in the console or API. Prices can vary by data-centre location; the control panel shows the current local price. — [Vultr pricing](https://www.vultr.com/pricing/#cloud-gpu)
- Public API on 24 Oct 2026:
  - `/v2/plans` returned only three Cloud GPU plans (L40S 1x/2x/4x, $1.671/$3.342/$6.684 per hour), each with an empty `locations` list.
  - `/v2/plans-metal` lists GH200 ($1.99/hr), 4x A100 ($9.589/hr), 8x L40S ($13.368/hr), 8x H100 ($23.92/hr), 8x B200 ($68/hr) and the AMD 8x systems, all with empty locations.
  - Ordinary VM plans do list locations.

  — [Vultr API plans](https://api.vultr.com/v2/plans?type=all&per_page=500); [Vultr API bare-metal plans](https://api.vultr.com/v2/plans-metal)
- Region availability on 24 Oct 2026: **London (lhr)** offers `vcg-a16-6c-60g-16vram`, `vcg-a16-12c-120g-32vram` and `vcg-a40-24c-120g-48vram`. Frankfurt (fra) and Newark (ewr) offer the same three. Manchester, Amsterdam and Paris showed no GPU plans. London bare-metal availability lists only CPU servers. — [Vultr API London availability](https://api.vultr.com/v2/regions/lhr/availability); [Vultr API regions](https://api.vultr.com/v2/regions)
- Vultr's European regions are Amsterdam, Paris, Frankfurt, London, Madrid, Manchester, Stockholm and Warsaw. — [Vultr API regions](https://api.vultr.com/v2/regions)
- Hosting options:
  - Cloud Compute: e.g. 1 vCPU / 1 GB at $5/mo ($0.007/hr), 2 vCPU / 4 GB at $20/mo ($0.03/hr).
  - CPU-optimised: 8 vCPU / 16 GB at $0.238/hr.
  - VX1 VMs: provisioning in under 15 seconds.
  - Free Kubernetes control plane.

  — [Vultr pricing](https://www.vultr.com/pricing/)
- Vultr Serverless Inference sells per-token open-weights models, e.g. DeepSeek-V4-Flash at $0.30/$1.00, Kimi-K2.6 at $0.30/$1.20 and GLM-5.1-FP8 at $0.85/$3.10 per million input/output tokens, plus MiniMax-M2.7 and Nemotron models. — [Vultr pricing](https://www.vultr.com/pricing/)

### Inferences
- **Choose a 1x A40 48 GB in London (Inference).** It has ample VRAM for DiffDock (including protein language-model embeddings) and GNINA's CUDA scoring, and its 24 vCPUs can run AutoDock Vina (CPU-only) as the fallback on the same box. An A16 16 GB is a budget fallback that is likely workable but slower. Plan on A40 because L40S/GH200 returned no locations, and avoid H100, which is only sold as 8x (about $18.40/hr, roughly 5.4 h of credit).
- Budget: $100 ≈ 58 h of A40 or about 212 h of A16. Running an A40 for the full event (about 30 h, roughly $51) still leaves room for a $5-$20/mo web VM. (Inference, assuming the $100 credit covers Cloud GPU, which is unconfirmed)
- **Realistic time to a working GPU docking API: 1-3 h (Inference).** That is 15-30 min for account, promo code and verification; 10-20 min to boot and check the NVIDIA driver and container runtime; and 30-90 min to pull or build a DiffDock image and fetch weights. Pre-building the image on a laptop or CI and pushing it to a registry, or using Vultr's container registry, saves time. Destroy the GPU instance when idle if credit runs short; Vultr bills hourly.
- Hosting the FastAPI backend and web app on a small Vultr VM in London, alongside the GPU worker, makes the Vultr story "the whole app runs on Vultr". Vultr Serverless Inference could add an open-weights juror, but it adds another LLM provider to manage, so it is optional. (Inference)
- If the team uses a DGX Spark for docking instead, a Vultr web-hosting-only integration is a weaker prize story. Consider DGX Spark primary and Vultr A40 as the cloud path (or vice versa), and show both in the demo. (Inference)

### Gaps
- Credit expiry; whether a card or prepayment is needed to activate the account; whether promo credit applies to Cloud GPU; whether new accounts face GPU quota or verification gating.
- Whether the A40/A16 images ship with NVIDIA drivers and Docker preinstalled.
- The exact London price, since local pricing can differ.
- Why the L40S/GH200/H100 plans show no locations (sold out or gated?).
- DiffDock/GNINA VRAM requirements were not verified here and should be checked against the docking research notes.

## Other partner prizes: cheap add-ons vs distractions

### Takeaway
The cheapest high-value add-on is the **Gemini API** as one more juror, called directly, or as a literature summariser. Gemini isn't served by Snowflake's REST API, so this adds model diversity and a prize entry in about 30 minutes. **ElevenLabs** voice narration for guided mode is an optional 1-2 h add-on. The **DEV** write-up can be done after the event. Solana, Presage, Delta, Hackiest Hack and Best Handmade are distractions for this app.

### Cited Findings
- Gemini offers via MLH:
  - A free one-year Google student plan: higher Gemini usage limits, 5 TB storage, Gemini Spark and Gemini Omni.
  - $10/month in credits via Google Program Benefits.
  - $300 in credits for new Google Cloud accounts.
  - Google AI Studio for building.

  The page names Gemini 3.1 Pro as the most accurate model in the student plan. — [MLH Gemini partner page](https://www.mlh.com/partners/gemini). The event also lists an "Intro to Google AI Studio" activity. — [MLH event page](https://www.mlh.com/events/oxhack-26)
- The Gemini prize's suggested ideas include an app that summarises complex research papers. — [Devpost](https://oxhack-2026.devpost.com/)
- ElevenLabs offer: a free 1-month Creator subscription via a promo code that MLH emails the week of the event. Features are TTS, low-latency voice agents, and API access over HTTP or WebSocket. — [MLH ElevenLabs partner page](https://www.mlh.com/partners/elevenlabs)
- Solana's prize targets transaction-heavy apps (games, DEX, payments). Presage's targets camera-based vital signs and emotion sensing. Delta's requires building in Delta and sharing threads. Hackiest Hack rewards over-engineering, and Best Handmade rewards building something from scratch. — [Devpost](https://oxhack-2026.devpost.com/)
- DEV Writing Challenge: $100, judged on technical substance, originality, storytelling and community popularity. — [MLH event page](https://www.mlh.com/events/oxhack-26)
- Auth0, GoDaddy Registry/.Tech, MongoDB, Arm, Cloudflare and DigitalOcean are absent from both the MLH partner list and the Devpost prize list. — [MLH event page](https://www.mlh.com/events/oxhack-26); [Devpost](https://oxhack-2026.devpost.com/)

### Inferences
- **Gemini (do it, about 30 min):** call the Gemini API directly with an AI Studio key, as an independent juror using the same JSON schema and evidence packet. This gives the jury a fourth vendor family that Snowflake REST can't provide, and enters the Gemini prize. Alternatively use Gemini for a "summarise the key papers for this drug-disease pair" panel, which matches the prize's own example. (Inference)
- **ElevenLabs (optional, 1-2 h):** narrate guided-mode steps and the jury verdict with TTS. A voice agent that walks a student through "pick disease → review candidates → choose drug and structure" matches the prize's "autonomous audio" emphasis better, but takes more like 3-5 h. Do it only after the core pipeline works. (Inference)
- **DEV Writing Challenge (after the event):** repurpose the README and demo into a DEV post. It takes no build time. (Inference)
- **Skip:** Solana (no fit; blockchain adds risk and noise to a scientific tool) and Presage (camera vitals have no role). Skip Delta unless the team already codes in it, since the tooling switch is mid-hack. Hackiest Hack and Handmade work against the app's polish. (Inference)

### Gaps
- Gemini API free-tier rate limits and whether an AI Studio key needs billing for the newest models.
- ElevenLabs Creator-tier character and agent-minute quotas.
- Whether MLH limits one team to one MLH prize at this event.

## Recommended minimal sponsor stack (maximise prize eligibility without bloating scope)

### Takeaway
Use **three core integrations already in the pipeline**: a Snowflake Cortex REST jury, Tiger Cloud experiment history, and a Vultr GPU docking worker (optionally hosting the app too). Add **one cheap add-on**: Gemini as a directly-called juror. That makes four sponsor touchpoints, each mapping to an MLH prize, for roughly 3-6 extra hours beyond the base build. Pitch the whole thing for HRT as data-driven decision support. ElevenLabs is the only further add-on worth considering, and only once the core works.

### Cited Findings
- The Snowflake prize centres on many LLMs from one account via its REST API. — [Devpost](https://oxhack-2026.devpost.com/)
- The Tiger Data prize favours innovative, impactful, performance-driven use and highlights continuous aggregates and compression. — [Devpost](https://oxhack-2026.devpost.com/)
- The Vultr prize promotes cloud compute and Cloud GPUs for AI apps. MLH gives $100 credit, and A40/A16 GPUs are orderable in London. — [Devpost](https://oxhack-2026.devpost.com/); [MLH Vultr page](https://www.mlh.com/partners/vultr); [Vultr API London availability](https://api.vultr.com/v2/regions/lhr/availability)
- The Gemini prize suggests research-paper summarisation, and Gemini isn't on the Snowflake REST model list. — [Devpost](https://oxhack-2026.devpost.com/); [Snowflake Cortex REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api)
- The HRT prize targets the best use of data for predictions and decision making. — [Devpost](https://oxhack-2026.devpost.com/)

### Inferences
- **Prize-to-integration map (Inference):**

| Prize | Integration | Extra effort beyond the base plan | Fit |
|---|---|---|---|
| HRT: Best Use of Data for Predictions and Decision Making | Whole app framed as decision support: agreement statistics, uncertainty or abstain, known-answer check (baricitinib), evidence trail | 1-2 h (metrics plus a "why we trust or doubt this ranking" panel) | Very high |
| MLH Snowflake API | Jury via Cortex REST Chat Completions (OpenAI SDK, JSON-schema outputs) across Claude, GPT, a preview outsider (Grok, Kimi or GLM) and Llama 3.1 8B | about 0.5-1 h on top of jury work (signup, PAT, cross-region check) | Very high |
| MLH Tiger Data | Experiment history as hypertables, one continuous aggregate (agreement or leaderboard), compression; optional pgvector | about 1-2 h | High if framed as time-series analytics |
| MLH Vultr | 1x A40 London as the DiffDock/Vina docking worker, plus optionally the web app on a small VM | about 1-3 h (mostly docking setup, needed anyway) | High |
| MLH Gemini API | Gemini as an independent juror, or as the paper summariser | about 0.5 h | Medium-high |
| MLH ElevenLabs (optional) | TTS narration of guided steps and the verdict | 1-2 h (voice agent 3-5 h) | Medium |
| DEV Writing Challenge (optional) | Post-event write-up | 0 build hours | n/a |

- **Hour-0 checklist, about 45 min in parallel across the team (Inference):**
  - Snowflake student trial: test AI_COMPLETE and REST immediately, add a card only if AI is disabled, check `CORTEX_ENABLED_CROSS_REGION`.
  - Vultr: discover.vultr.com/mlh registration for the code, then account plus gift code, then try launching an A40 in London early to surface any GPU gating.
  - Tiger Cloud trial service in eu-west-2.
  - Gemini AI Studio key.
  - Watch email for the ElevenLabs code.
- **Scope guards (Inference):**
  - No SPCS docking.
  - No Streamlit in Snowflake UI.
  - No Tiger forks or MCP agents (not rewarded by the prize text).
  - No Solana, Presage or Delta.
  - No absent sponsors (Auth0, .Tech, MongoDB, Arm, Cloudflare, DigitalOcean).
  - Keep the jury at 4-5 models, so a slow or preview model can be dropped without breaking the demo.
- **Fallbacks (Inference):**
  - If Snowflake AI stays disabled, the jury still needs a path. Gemini direct is ready, and it is worth asking the Snowflake/MLH mentors on site.
  - If Vultr GPU is gated, use DGX Spark or Mac CPU Vina, and keep the web app on a Vultr VM to stay eligible.

### Gaps
- Whether OxHack/MLH caps MLH prizes per team, which would cut the marginal value of the fourth or fifth integration.
- Judging rubrics for HRT and the general prizes.
- Whether the Snowflake student trial enables AI without a card.
- GPU quota policies for brand-new Vultr accounts.
