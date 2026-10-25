# OxHack '26: rules, schedule, prize tracks and the HRT prize, with a strategy for an evidence-first drug-repurposing app

> **Older research snapshot.** Where this note differs from `plan.md`, follow `plan.md`. In particular: docking runs AutoDock Vina on CPU (no rented GPUs), the Model jury uses three Snowflake Cortex model families (no Gemini), and IDs are mapped through UniProt and Ensembl IDs, never gene symbols.


Research done Sat 24 Oct 2026, roughly 12:30–13:55 UTC (13:30–14:55 BST). The event was already live: MLH showed "Live Now", and the organiser countdown puts the start of hacking at 12:00 BST today. Pages were fetched raw (curl) and quotes were taken from the HTML text. Devpost pages carry no "last updated" stamp. The only dated organiser post found is from 26 Sep 2026. The Devpost Updates tab is still empty.

---

## Q1. When and where is OxHack '26, how long is hacking, and what is the exact timeline (opening, hacking start, submission deadline, judging, closing)?

### Takeaway
OxHack '26 runs Sat 24 to Sun 25 Oct 2026 at the Mathematical Institute (Woodstock Rd, Oxford):
- Registration opens 09:00 BST.
- Hacking starts 12:00 BST Saturday.
- The event should finish by 16:30 on Sunday.

Hacking lasts about 24 hours. The UK clocks go back at 02:00 on Sunday 25 Oct, which is in the middle of the hack.

No detailed run-of-show has been published. The Devpost dates are entered in US Eastern time (EDT), so they disagree with the organiser's times. Confirm the real submission deadline at the opening ceremony.

### Cited Findings
**Dates and venue**
- The Devpost page gives "Oct 24 – 25, 2026", venue "Mathematical Institute", host org "Oxford University", tags "Beginner Friendly" and "Open Ended", and "13 non-cash prizes". At fetch time it showed "Submissions open soon" and "Participants (3)". — [Devpost overview](https://oxhack-2026.devpost.com/); [Devpost hackathon API](https://devpost.com/api/hackathons?search=oxhack) (`"submission_period_dates":"Oct 24 - 25, 2026"`, `"prizes_counts":{"cash":0,"other":13}`, `"prize_amount":"£0"`)
- The organiser post says the hackathon "is to be held from the 24th to the 25th October 2026 at the Mathematical Institute, located on Woodstock Rd in Oxford". It was posted 26 Sep 2026 and links "Sign up here: 26.oxhack.net / Join our Discord: 26.oxhack.net/discord". — [OxHack Bluesky post (image alt text)](https://bsky.app/profile/oxhack.net/post/3mwgdj2s4vk2q); same text on [OxHack LinkedIn](https://www.linkedin.com/company/oxhack/)

**Organiser times**
- FAQ, verbatim: "Registration will open at 9 AM on Saturday 24th October, and we expect the event to finish by 4:30 PM on Sunday 25th October. A more complete schedule will appear on our website soon!" That schedule had not appeared by 24 Oct, about 13:50 BST. — [26.oxhack.net FAQ](https://26.oxhack.net/)
- The site's countdown script has `const eventDate = new Date('2026-10-24T09:00:00+01:00')` and `const hackingDate = new Date('2026-10-24T12:00:00+01:00')`. After the second time it shows "HACKING ONGOING!". That makes the official start of hacking 12:00 BST (11:00 UTC) Saturday. — [26.oxhack.net page source](https://26.oxhack.net/)

**Devpost schedule (stored in EDT)**
- Submissions: "October 24 at 12:00pm EDT" to "October 25 at 12:00pm EDT". Winners announced: "October 25 at 4:00pm EDT". The ISO timestamps are `2026-10-24T12:00:00-04:00`, `2026-10-25T12:00:00-04:00` and `2026-10-25T16:00:00-04:00`. — [Devpost Dates](https://oxhack-2026.devpost.com/details/dates)
- In UK time that is: submissions open 17:00 BST Sat, the deadline is 16:00 GMT Sun, and winners are announced 20:00 GMT Sun. These conversions are my own arithmetic.

**MLH listing**
- "Live Now … OCT 24 - 25 Oxford, England In Person", "Registration & check-in: Managed on the event website".
- It gives "Date Sat, Oct 24 · 1:11 AM – Sun, Oct 25 · 9:00 PM UTC". The embedded data says `startsAt 2026-10-24T01:11:11Z`, `endsAt 2026-10-25T21:00:00Z`.
- The event sits in MLH's 2027 season list. — [MLH event page](https://www.mlh.com/events/oxhack-26); [MLH 2027 season](https://www.mlh.com/seasons/2027/events)

**Saturday MLH workshops** (hosted by Oscar Ryley, MLH)
- "Hacking with GitHub Copilot @ OxHack '26", Saturday 5:30PM to 11:00PM BST. — [MLH workshop 15617](https://events.mlh.com/events/15617)
- "Intro to Google AI Studio @ OxHack '26", Saturday 7:00PM to 11:00PM BST. — [MLH workshop 15616](https://events.mlh.com/events/15616)

**Clock change**
- UK clocks go back on 25 October 2026: "back 1 hour at 2am on the last Sunday in October". — [GOV.UK clock changes](https://www.gov.uk/when-do-the-clocks-change)

**MLH duration and judging rules**
- "Member Events are 24 to 48 hours long … Judging and prizes must be awarded at the end of your hackathon on Sunday."
- "MLH Member Events must complete judging and awards on the event's last day."
- "No Elimination Rounds … All hackers must be allowed to hack for the same duration of time." — [MLH Member Event Guidelines](https://github.com/MLH/mlh-policies/blob/main/member-event-guidelines.md)
- MLH's organiser guide: judging "usually takes around 2 - 3 hours, depending on the number of submissions and judges". — [MLH Organizer Guide: Judging Plan](https://guide.mlh.io/general-information/judging-and-submissions/judging-plan)
- Opening ceremony: "Reserve 10 minutes for your MLHer to speak (with slides) during the opening ceremony…" — [MLH Member Event Guidelines](https://github.com/MLH/mlh-policies/blob/main/member-event-guidelines.md)

**Organisers and community**
- CompSoc runs the event: "CompSoc has been Oxford's premier society for things computing and tech related for almost 50 years, and this year OxHack is relaunching as a semi-independent flagship event." — [Devpost overview](https://oxhack-2026.devpost.com/)
- Contact: committee@oxhack.net. Socials: X @OxHackTeam, Instagram @oxhackteam, Bluesky oxhack.net, LinkedIn company/oxhack. The Discord invite resolves to discord.com/invite/jSSWzejDVD. — [26.oxhack.net](https://26.oxhack.net/)
- The Discord server "OxHack '26" showed about 613 members and 235 online at fetch time. — [Discord invite API for 26.oxhack.net/discord](https://discord.com/api/v10/invites/jSSWzejDVD?with_counts=true)
- HackNotts '26 runs the same weekend (24–25 Oct, University of Nottingham). — [Hackathons UK events](https://www.hackathons.org.uk/events/)

### Inferences
- **Hacking window.** Hacking runs from 12:00 BST Sat. The likely end is about 12:00 Sunday local time (GMT).
  - Organiser intent: a noon start, and an event end of 16:30 that leaves 2–3 h for judging plus a closing ceremony.
  - Devpost's "12:00pm" values look like UK noon typed into Devpost's default Eastern time zone.
  - Taken literally, Devpost would accept submissions until 16:00 GMT, after judging would need to start, and would announce winners at 20:00 GMT, after the event ends. That is implausible.
  - Treat 12:00 Sunday local as a working deadline. Aim to submit by 11:00 GMT. Ask at the opening ceremony or on Discord.
- **Clock change.** A noon-to-noon window is 25 hours of real time because of the clock change. If the organisers define "24 hours", the deadline could be 11:00 GMT.
  - Any timestamps, cron jobs or job-queue timeouts in the app should use UTC.
  - Re-check device clocks after 02:00 BST.
- **Likely run of show** (inferred from the FAQ, MLH rules and typical MLH events):
  - 09:00–~11:30 Sat: registration and check-in, opening ceremony with a roughly 10-minute MLH slot, team-building.
  - 12:00 Sat: hacking starts.
  - Saturday evening: MLH workshops and mini-events.
  - About 12:00 Sun: deadline.
  - About 12:30–15:00: judging.
  - About 15:30–16:30: closing ceremony and awards.

### Gaps
- No official detailed schedule, run-of-show or exact submission deadline (with time zone) has been published. The FAQ promises one "soon"; it may be on the Discord, which needs login.
- Opening and closing ceremony times and the judging window are unconfirmed.
- Attendance numbers are unknown. Devpost registrations (3) are far below the Discord count (613), so most people have not joined Devpost yet.

---

## Q2. What are all the prize tracks and their exact criteria? Which are MLH partner prizes and which are organiser or sponsor tracks?

### Takeaway
Devpost lists 13 prizes, all non-cash:
- 2 general prizes: First Place and Runner Up.
- 3 organiser/partner/sponsor prizes: Hackathons UK "Hackiest Hack", Citadel-backed "Best Handmade" (judged by Tom 7), and HRT "Best Use of Data for Predictions and Decision Making".
- 7 MLH partner prizes: ElevenLabs, Gemini API, Solana, Tiger Data, Presage, Vultr, Snowflake API.
- 1 Zed/Delta prize: "Built with Delta".

MLH's page adds an 8th MLH category, the DEV Writing Challenge ($100). The general judging criteria are Creativity, Technicality, Completeness and Presentation/Hackathon Spirit, with no weights. Only the Delta prize publishes weights. Prize values are given only for the MLH hardware prizes, the DEV Writing Challenge ($100) and Hackiest Hack (shark plushes). First Place, Runner Up, Best Handmade and HRT have no stated value.

### Cited Findings
**Sponsor tiers on Devpost**
- Platinum: HRT, linking to hudsonrivertrading.com.
- Gold: Citadel, Entangl.
- Silver: Jane Street, Oxford Asset Management (OxAM), Zed.
- Bronze: Talos.
- Partners: Hackathons UK, MLH, GitHub Education.
- Source: [Devpost overview, sponsor logos/alt text](https://oxhack-2026.devpost.com/)

**Main challenge (exact text)**
- "Build something (anything!). That's it! There's no required theme or problem to solve. … Sponsors may also offer optional challenges and prizes alongside the main hackathon."
- "What to Build: Anything! There are no constraints on what your project needs to be. Hardware hacks, apps, websites, games, AI projects, creative experiments, physical builds, and no-code projects are all encouraged."
- The "What to Submit" heading is empty.
- Source: [Devpost overview](https://oxhack-2026.devpost.com/)

**General judging criteria and judges**
- Criteria, listed with no descriptions or weights: "Creativity", "Technicality", "Completeness", "Presentation/ Hackathon Spirit".
- Judges listed: "OxHack Committee & Volunteers"; "Holly Packer — Hackathons UK"; "Oscar Ryley — MajorLeagueHacking"; "Tom Murphy VII".
- The Rules page heading "Judging Criteria and Winner Selection" is empty, and it says "Prizes: To be announced".
- Sources: [Devpost overview](https://oxhack-2026.devpost.com/); [Devpost Rules](https://oxhack-2026.devpost.com/rules)

**All 13 Devpost prizes, verbatim.** Each has "1 winner". The value shown is the text before "||" on Devpost.

1. **First Place** (organiser): "This is a general prize catergory. Awarded by OxHack Committee and friends." No value stated.
2. **Runner Up** (organiser): "This is a general prize category. Awarded by OxHack and friends." No value stated.
3. **[Hackathons UK] Hackiest Hack** (partner): "Build something over-the-top over engineered and held together with string. Use your imagination. Our favourite project will win Shark Plushes for each team member."
4. **Best Handmade Prize** (Citadel): "Judged by Tom 7! Get creative and build something from scratch. This challenge is with thank to Citadel." No value stated.
5. **[HRT] Best Use of Data for Predictions and Decision Making** (HRT): "Use your creativity to make the best use of data." No value stated.
6. **[MLH] Best Use of ElevenLabs**, "Wireless Earbuds": "Deploy natural, human-sounding audio with ElevenLabs. … Integrate fully autonomous audio experiences into your hack with ElevenLabs and give your project a voice, along with giving your team the chance to win some wireless earbuds!"
7. **[MLH] Best Use of Gemini API**, "MLH Swag Kits": "It's time to push the boundaries of what's possible with AI using Google Gemini. … Understand language like a human and build a chatbot that gives personalized advice / Analyze info like a supercomputer and create an app that summarizes complex research papers / Generate creative content like code, scripts, music, and more …"
8. **[MLH] Best Use of Solana**, "Unruggable Hardware Wallets": "…Create a game, social app, or consumer product that relies on instant, high-frequency transactions. Design a sophisticated trading, lending, or decentralized exchange (DEX). … Show us how you can innovate with Solana for a chance to win Unruggable Hardware Wallets for you and each member of your team!"
9. **[MLH] Best Use of Tiger Data**, "Stream Deck Mini": "Tiger Data extends PostgreSQL to give student developers an ultra-fast foundation for real-time data, time-series metrics, and complex analytics. … Standard SQL Power … Unified Data Stack: Store relational user profiles and high-frequency metric streams side-by-side in a single database. Instant Dashboards: Serve lag-free, real-time frontend charts using pre-computed Continuous Aggregates. 90%+ Data Compression … Whether you're building real-time IoT monitoring, AI-driven analytics dashboards, or financial prediction engines, show us how Tiger Data powers your project. The team that demonstrates the most innovative, impactful, and performance-driven use of Tiger Data will take home some great prizes!"
10. **[MLH] Best Use of Presage**, "Fitbit Inspire & Presage Perks": camera-based vital signs, emotion and focus SDK. Perks: "Free refills for Presage Development credits … next three months" and "30% off all Presage usage charges for your first year after going live".
11. **[MLH] Best Use of Vultr**, "M5Stack Official Tab5": "Vultr empowers hackers to bring their high-performance projects to life instantly; providing everything from the speed of one-click deployment and scalable cloud compute, to specialized Vultr Cloud GPUs that can power AI-driven applications. We want you to push the limits of what can be built when infrastructure is no longer the bottleneck! Sign up for a Vultr account today and claim your free cloud credits!"
12. **[MLH] Best Use of Snowflake API**, "Arduino Student Kit": "Play with industry-leading LLMs on a single account using the Snowflake APIs. Adding AI capabilities into your application can be as simple as a single CURL command to Snowflake's REST API. Build customized applications, RAG powered chat bots, or embed AI-powered features into your app in half the time with half the hassle. Get started for free with a special, student 120-day Snowflake trial…"
13. **Built with Delta: Show off how you worked together in Delta. Extra points for projects that solve real problems.**
    - Text: "Work sync (or async) alongside teammates and agents. Use Delta from brainstorming/ideation, building, all the way through testing. Share your Delta threads to show examples of how you collaborated."
    - What they want: "Projects that feel fast… Projects that solve a real problem. Not a demo. Something you'd actually open tomorrow… Clean code, smart architecture, good decisions."
    - Weights: "Speed & Performance (30%) … Technical Implementation (25%) — Clean code, smart architecture, good use of Rust or collaboration features. Innovation (25%) … Polish & Usability (20%)".
    - Tokens: "Use OpenRouter tokens in Delta."

Source for all 13: [Devpost overview](https://oxhack-2026.devpost.com/)

**Delta's sponsor**
- Delta is "A Multiplayer Environment for Coding with Agents … From the creators of Zed". Zed is a Silver sponsor. — [delta.dev](https://delta.dev/); [Zed blog "Introducing Delta"](https://zed.dev/blog)

**MLH page**
- It lists "8 categories": the 7 MLH prizes above plus **DEV Writing Challenge, "$100"**.
- Text: "Publish what you built on DEV … Each month, the DEV editorial team will select at least one favorite project… Selections consider technical substance, originality, clear storytelling, and community popularity."
- This category is not on Devpost.
- Source: [MLH event page](https://www.mlh.com/events/oxhack-26)

**MLH criteria for MLH categories (two MLH documents disagree)**
- MLH Standard Hackathon Rules: "Teams will be judged on these four criteria for MLH digital events or MLH categories at an in person event. Judges will weigh the criteria equally": Technology, Design, Completion, Learning.
  - They explicitly exclude "How good your code is", "How well you pitch", "How good the idea is", and "How well the project solves a problem". — [MLH Standard Hackathon Rules](https://github.com/MLH/mlh-policies/blob/main/standard-hackathon-rules.md)
- MLH Contest Terms: "originality/creativity (25%); technical complexity (25%); adherence to Theme (25%) and practical implementation (25%)".
  - "An employee or contractor of Major League Hacking … will be responsible for judging Applications." — [MLH Contest Terms](https://github.com/MLH/mlh-policies/blob/main/contest-terms.md)
  - The Contest Terms file fetched covers the term "July 1, 2025 … June 30, 2026". OxHack is in MLH's 2027 season, so a newer version may apply.

**Previous Oxford hackathon criteria (context)**
- OxfordHack Nov 2022 used Technology, Design, Completion, Learning, plus "Best Practices (use of branches, pull requests, reviewing each other's code, writing a comprehensive README, and using issues…)". — [OxfordHack 2022](https://oxfordhack-16661.devpost.com/)

### Inferences
- **Who judges what.**
  - MLH categories are almost certainly judged by the MLH coach, Oscar Ryley (MLH workshop host and listed judge).
  - Hackiest Hack is most likely judged by Holly Packer (Hackathons UK).
  - Best Handmade is judged by Tom Murphy VII ("Judged by Tom 7!").
  - First Place and Runner Up are judged by the committee.
  - No HRT judge is listed, so the HRT prize is presumably judged by HRT staff on site. See Q3.
- **Quant-firm audience.** There are seven tiered sponsors: HRT, Citadel, Entangl, Jane Street, OxAM, Zed, Talos. Four are well-known quantitative trading or investment firms: HRT, Citadel, Jane Street, OxAM. Talos's name suggests trading technology, but I have not verified that. Sponsor reps walking the expo will probably reward quantitative rigour, clear data handling and decision framing, beyond the HRT prize alone.
- **Unstated values.** The values of First Place, Runner Up, Best Handmade and HRT are not published ("To be announced"). Devpost still shows £0 cash.

### Gaps
- No weights or descriptions for the four general criteria.
- No prize values for First Place, Runner Up, Best Handmade or HRT.
- No published prizes from Entangl, Jane Street, OxAM or Talos. They may announce challenges at the opening ceremony.
- The Devpost "Only specific countries/territories included" list could not be read.

---

## Q3. What exactly is the HRT prize, and what kinds of projects have won HRT prizes at other hackathons?

### Takeaway
The OxHack HRT prize is "[HRT] Best Use of Data for Predictions and Decision Making". It has 1 winner, and its full description is one line: "Use your creativity to make the best use of data." No judges, criteria or value are stated.

The same prize ran at IC Hack 26 (Imperial, Jan/Feb 2026). It continues HRT's long-running "Best Use of Data" prize at US hackathons. Every HRT data-prize winner found:
- built on real external datasets;
- used an explicit quantitative or ML model to make predictions;
- usually reported a validation number or compared against ground truth;
- turned the output into a decision or action.

One winner was a biomedical research tool: tumour invasion kinetics, TreeHacks 2025.

### Cited Findings
**OxHack 2026 prize**
- Text: "[HRT] Best Use of Data for Predictions and Decision Making — 1 winner — Use your creativity to make the best use of data." HRT is the sole Platinum sponsor. — [Devpost overview](https://oxhack-2026.devpost.com/)

**Same prize at IC Hack 26** (Imperial, 31 Jan to 1 Feb 2026)
- Prizes: "HRT - Best Use of Data for Predictions & Decision-Making — 1 winner — To Be Determined", plus a separate "(Honourable Mention)". — [IC Hack 26 Devpost](https://ic-hack-26.devpost.com/)
- **Winner: WildFire**, "Predict wildfire spread to inform emergency service decisions." Built with flask, python, react.
  - Method: "mathematical models to predict wildfire spread based on historical data, using stochastic Percolation-based simulations and Monte Carlo techniques … we can test out mitigation strategies such as clearing tree lines and retardant areas, and evaluate their effect".
  - Data: a satellite API, a California Fire Department API, USDA Forest Service vegetation density, and weather/wind data.
  - The "Claude API [was used] for summarising historical events". The gallery shows a "Fire spread model comparison with the data points of the fire starting locations".
  - Source: [WildFire](https://devpost.com/software/wildfire-rcz2xb)
- **Honourable mention: SafeStep**, "Transform raw safety data into actionable routes … powered by real crime statistics, verified reviews, and predictive mapping."
  - Uses DistilBERT to turn incident reports into "quantitative safety signals", plus "Gaussian weighting", temporal multipliers and an "intelligent safety forecaster". Stack: PostgreSQL+PostGIS, FastAPI, React, Mapbox.
  - Source: [SafeStep](https://devpost.com/software/safestep-6ci719)

**HRT's standard US prize text** (HackHarvard 2022 and TreeHacks 2023, 2024, 2025)
- "Effective use of data is important to the decisions we make at Hudson River Trading, and we're always looking for innovative new ways to strategize with data. This prize will be awarded to the hack that best integrates the use of data into their project." — [HackHarvard 2022](https://hackharvard2022.devpost.com/); [TreeHacks 2023](https://treehacks-2023.devpost.com/); [TreeHacks 2024](https://treehacks-2024.devpost.com/); [TreeHacks 2025](https://treehacks-2025.devpost.com/)

**Past HRT prize values**
- HackHarvard 2022: "$150 Amazon card per person on winning team and access to our VIP Swag Store for each member". — [HackHarvard 2022](https://hackharvard2022.devpost.com/)
- TreeHacks 2023: "4 x Access to online HRT VIP Swag Store & $150 Amazon Gift Card". — [TreeHacks 2023](https://treehacks-2023.devpost.com/)
- TreeHacks 2024: "4x HRT Keyboard + Mouse". — [TreeHacks 2024](https://treehacks-2024.devpost.com/)
- TreeHacks 2025: "$200 in cash" plus "HRT-branded JBL earbuds per team member". — [TreeHacks 2025](https://treehacks-2025.devpost.com/)

**Past HRT winners**
- **TreeHacks 2025: STIK GUI (Spheroid Tumor Invasion Kinetics).**
  - "An AI-powered tool for tracking and predicting spheroid tumor invasion kinetics that eliminates the need for manual tracing." It grew out of a glioblastoma lab workflow.
  - Researchers "upload their data and let STIK_GUI handle segmentation, analysis, and visualization".
  - Built with conda, cvat, pyqt, python, yolo.
  - Source: [STIK GUI](https://devpost.com/software/tumor-invasion-kinetics-gui)
- **TreeHacks 2024: Bino-SoRAs.**
  - "AI-generated video detection using interpolated next-frame-prediction and Fréchet inception distance to generate 92% accurate zero-shot classification." It extends the Binoculars framework (Hans et al., Jan 2024).
  - Source: [Bino-SoRAs](https://devpost.com/software/watchdog-onxyge)
- **TreeHacks 2023: ShipSense.app.**
  - It fine-tuned Stable Diffusion for few-shot synthetic satellite data ("We only used 68 original images!"), then a detector "with 96% accuracy", plus a hotspot dashboard so governments can "take action".
  - The same project also won the Sustainability Grand Prize, Meta's Most Innovative Hack and Replit's Choice Award.
  - Source: [ShipSense](https://devpost.com/software/shipsense-ai-novel-data-augmentation-protocol)
- **HackHarvard 2022: NFT Laundromat.**
  - It found NFT wash traders and rug-pullers in public on-chain data, using "the machine learning graph theory algorithm we developed based on past research papers". Data was pulled with SQL from transpose.io.
  - Source: [NFT Laundromat](https://devpost.com/software/nft-laundromat)
- **HackMIT 2016, a different HRT prize.**
  - Prize: "Best Low Level / High Performance Hack (Hudson River Trading)": "At HRT we care about performance; both throughput and latency."
  - Winner: JS Policy, a JavaScript sandbox using web workers and a sandboxed iframe.
  - Sources: [HackMIT 2016](https://hackmit-2016.devpost.com/); [JS Policy](https://devpost.com/software/js-policy)

**HRT as judge**
- At HackBU 2016 the judges included "Kimberly Martin, People Operations, Hudson River Trading", "Mike Popoloski, Algo Engineer, Hudson River Trading" and "Shannon Lee, Core Developer, Hudson River Trading". — [HackBU 2016S](https://hackbu-2016s.devpost.com/)

**HRT as sponsor with no HRT prize text**
- HRT's logo or link appears on Hack the North 2024–2026, HackPrinceton Fall 2025, HackGT 12, HackMIT 2023 and IC Hack 22. My scan found no HRT prize text on those pages. — e.g. [Hack the North 2025](https://hackthenorth2025.devpost.com/); [IC Hack 26](https://ic-hack-26.devpost.com/)

**Previous Oxford hackathons**
- Neither the Feb 2022 nor the Nov 2022 Oxford hackathon listed HRT.
- Nov 2022 had quant-adjacent prizes, for example "Best Solution with Inclusive Design and Accessibility in Mind - Marshal Wace" (won by RequalifyMe) and "Best Hack for Social Good with BlackRock - MLH". A judge came from Remus Capital.
- Sources: [OxfordHack 2022](https://oxfordhack-16661.devpost.com/); [RequalifyMe](https://devpost.com/software/requalifyme); [Oxford Hack 2022 (Feb)](https://oxford-hackathon-2022.devpost.com/)

### Inferences
**What the 7 HRT winners have in common (my synthesis of the sources above)**
1. Data is the core of the product, not decoration. Several real sources are fused: fire, vegetation and weather; crime and reviews; on-chain trades; imagery.
2. There is an explicit predictive or quantitative model: Monte Carlo/percolation, Gaussian-weighted scoring, graph algorithms, segmentation-based kinetics, statistical detectors. LLMs are helpers. WildFire used Claude only "for summarising".
3. They show evidence the model works: 92% and 96% accuracy, or model-vs-observed comparisons.
4. The output feeds a decision: mitigation strategy, safest route or time, flag a fraudster, act on fishing hotspots, automate lab analysis.
5. Several are grounded in research papers.
6. A biomedical research tool (STIK) has already won, so a drug-repurposing project is squarely in scope.

**Who will judge.** The OxHack prize is renamed (as at IC Hack 26) to stress "Predictions" and "Decision Making". Expect HRT engineers or quants to judge at the expo, as HRT staff did at HackBU. They are likely to probe:
- how the ranking is computed;
- how uncertainty is measured;
- whether the "prediction" is validated or just retrieved;
- how a user would actually decide.

**How to frame the project for HRT: "evidence → prediction → decision → backtest"**
- **Name the decision.** "Given a disease, which 3 approved drugs should a student or lab investigate first, and how sure are we?" Output an explicit triage label, such as Investigate / Watch / Deprioritise, with a confidence score and the evidence that drives it.
- **Make the data visible.** Show the Open Targets association scores, ChEMBL pChEMBL/bioactivity counts per target, clinical phase and approval status, and PubChem structure checks. Show provenance per evidence item and the counts processed. That matches "best use of data".
- **Add a transparent baseline score next to the LLM jury.** A deterministic evidence-weighted score (for example, a weighted sum of target association × drug potency at that target × approval status) lets the LLM ranking be compared with a simple quantitative model. Quant judges will ask, "does the LLM beat a baseline?"
- **Treat the model jury as forecast aggregation.** Compute consensus with Borda count or mean rank. Measure agreement with Kendall's W, pairwise Spearman correlation or top-k overlap. Show disagreement as calibrated uncertainty, and flag "high-disagreement" candidates for human review. Ensembles and disagreement are core quant vocabulary.
- **Turn the known-answer check into a real backtest.** Baricitinib is now an approved COVID-19 treatment, so Open Targets and ChEMBL already contain direct drug–disease evidence. Ranking it first could be retrieval, not prediction.
  - Hide direct disease–drug indication and clinical evidence for the disease being tested (leave-one-out, or time-split where the data allow).
  - Report baricitinib's rank, for example "rank 2 of 140 candidates with direct evidence masked".
  - Do the same for one or two established multiple-myeloma drugs, for example precision@5 on hidden known drugs.
  - This gives a validation number like the 92% and 96% figures in past HRT winners.
- **Make docking the expensive "information-gathering" step.** Run it only on top-ranked or high-disagreement candidates, show how the docking result changes the decision, and be candid about docking-score noise. Put "what would change our mind" in the UI.
- **Keep the claims modest.** Present it as "hypothesis triage for learning, not medical advice". Overclaiming will hurt with technical judges.

### Gaps
- No public information on who judges the HRT prize at OxHack, its value, or any extra HRT criteria. Ask the HRT booth on Saturday what they look for.
- No public HRT write-up of what it rewards at hackathons. HRT's website returned HTTP 403 to automated fetches.
- No information on HRT's own European university hackathon programme.
- No evidence that HRT sponsored previous Oxford hackathons. No Devpost pages exist for OxfordHack/OxHack 2023–2025, which is consistent with the "relaunching" wording.

---

## Q4. What are the rules on pre-hackathon work, team size, the number of prize tracks per submission, and demo requirements?

### Takeaway
- **Eligibility:** enrolled university students aged 18+ (the FAQ also admits anyone within a year of graduating). Students at universities outside the UK must contact the committee.
- **Team size:** up to 4.
- **Submission:** Devpost plus a GitHub link. OxHack requires nothing else.
- **Rules:** OxHack follows the MLH Code of Conduct and, by MLH membership, MLH's standard expectations.
  - The idea may predate the event, but all project work, code and materials must be created during hacking.
  - MLH's prize terms explicitly disqualify prior work.
- **Prize tracks:** OxHack publishes no cap. MLH limits a team to one entry per category, and Devpost projects can win several prizes.
- **Demo:** no video is required, but MLH recommends a 2-minute demo video. Judging is almost certainly an in-person, science-fair-style demo. The exact format is unpublished.

### Cited Findings
**Eligibility and team size**
- Devpost Rules: "Dates 24th October - 25th October. Eligibility: Enrolled university student (18+). Project and Submission Requirements: Submit your project on devpost and provide a GitHub link to your project. Prizes: To be announced." — [Devpost Rules](https://oxhack-2026.devpost.com/rules)
- Devpost "Who can participate": "Above legal age of majority in country of residence; Students only; Only specific countries/territories included". — [Devpost overview](https://oxhack-2026.devpost.com/)
- FAQ: "OxHack is aimed at all enrolled university students across the UK, aged 18+, or within a year of having graduated if you're no longer still a student… If you're based at a university outside of the UK, please get in touch with committee@oxhack.net as there may be visa requirements." — [26.oxhack.net](https://26.oxhack.net/)
- FAQ: "Teams can have up to 4 people!"; "You're also welcome to work independently"; the event is free with food provided; "OXHACK FOLLOWS THE MLH CODE OF CONDUCT". — [26.oxhack.net](https://26.oxhack.net/)

**Pre-event work: MLH Standard Hackathon Rules** (MLH member events may use these or their own)
- "6. All work on a project should be done during the period of the hackathon."
- "7. Teams can use an idea they had before the event."
- "9. Teams can work on an idea that they have worked on before (as long as they do not re-use code or other project materials)."
- "10. Teams can use libraries, frameworks, or open-source code in their projects. Working on a project before the event and open-sourcing it for the sole purpose of using the code during the event is against the spirit of the rules and is not allowed."
- "11. Teams must stop hacking once the time is up. However, teams are allowed to debug and make small fixes…"
- "12. Your code must be available publicly (ideally in a git repository). 13. Your code must remain public post event to be eligible for prizes."
- Source: [MLH Standard Hackathon Rules](https://github.com/MLH/mlh-policies/blob/main/standard-hackathon-rules.md)

**Pre-event work: MLH prize terms** (stricter; apply to MLH categories)
- "All work on your Application must be performed during the time window defined at the Event. You may not perform any work on your Application prior to the time window defined at the Event or your Application will be disqualified at the sole discretion of the Sponsor."
- "Individuals and Teams are limited to one (1) Application for each Category in each Event."
- "You may participate with more than one (1) Application at each Event."
- "Each Participant or team must be available during the Event's judging period to demonstrate."
- Source: [MLH Contest Terms](https://github.com/MLH/mlh-policies/blob/main/contest-terms.md)

**AI tools**
- "Teams may use AI to assist them while coding…"
- "Teams should be honest and transparent about the AI code tools they used. This includes listing them in their project submissions and answering questions when talking to organizers, judges, and other hackers."
- Source: [MLH Standard Hackathon Rules](https://github.com/MLH/mlh-policies/blob/main/standard-hackathon-rules.md)

**Demo expectations**
- "After hacking finishes, teams will show their projects to each other and to the judges… live demos at physical hackathons."
- "Pitches and presentations are discouraged. You are not judged on the quality of your pitch… As you are judged on what you built, you'll only hurt yourself by not showing a demo."
- The 2-minute video rule applies to "fully digital hackathons that MLH hosts".
- Source: [MLH Standard Hackathon Rules](https://github.com/MLH/mlh-policies/blob/main/standard-hackathon-rules.md)

**MLH organiser-guide judging format** (OxHack's own format is unpublished)
- MLH recommends science-fair judging: "every hacker team setting up their stall at assigned table numbers. Hackers present … in front of the judges one by one as they arrive at their stalls".
- "Many events only have one judging round, though some may pick finalists to show off during closing ceremony. Keep in mind you will need ~7 minutes per team if you do this, 3-5 for the presentation and 2 minutes to set up."
- "we recommend having hackers submit 2 minute videos on your submission platform… Their video should be a demo of their hack, not a presentation."
- MLH favours stack ranking across judges.
- "average submission rate of 1 project per 4 checked-in hackers."
- Source: [MLH Organizer Guide: Judging Plan](https://guide.mlh.io/general-information/judging-and-submissions/judging-plan)

**Prize opt-in and submission fields**
- "The project submission platform … must be able to add custom prizes and allow hackers to opt in to submit to prize categories." — [MLH Member Event Guidelines](https://github.com/MLH/mlh-policies/blob/main/member-event-guidelines.md)
- MLH's required fields include: Project Name; Submission URL; About the Project; Try it out / GitHub Link; a domain-name question; "Opt-In Prizes (any categories/tracks they submitted to)"; Built With; tech feedback; schools; team member info; "Which of the following GenAI tools did you use this weekend? (Required Dropdown Multiselect)"; "Did you implement a generative AI model or API in your hack this weekend? (Required Long text)". — [MLH Organizer Guide: Submission portal](https://guide.mlh.io/general-information/judging-and-submissions/set-up-your-hackathon-portal)

**Precedent for winning several prizes**
- ShipSense won 4 prizes at TreeHacks 2023, including HRT's. — [ShipSense](https://devpost.com/software/shipsense-ai-novel-data-augmentation-protocol)

### Inferences
**What to do about the team's prior materials**
- **Planning documents:** fine as "an idea they had before the event". Do not paste pre-written project text or design assets into the submission. Write the Devpost story during the event.
- **Throwaway HTML prototypes:** treat as off-limits. Rule 9 bans re-using "code or other project materials", and MLH's prize terms ban any prior work on the Application. Start a fresh repo with first commit after 12:00 BST Saturday, and rebuild the UI from scratch. The git history will show this.
- **Disclose:** say in the Devpost "About" and to judges that ideation and planning happened beforehand, and that all code was written this weekend.
- **Prepared protein structures and environments:** public datasets and open-source tools (Open Targets, ChEMBL, PubChem, RCSB PDB, DiffDock, Vina, model weights, Docker images) count as "libraries… or open-source code" and are allowed.
  - A protein-preparation pipeline, curated input files, or project-specific glue scripts made before 12:00 Sat would be "project materials".
  - The safe path is a protein-prep script written during the event, with results cached during the event.
- **Docking timing:** heavy compute started after hacking begins (pre-computed DiffDock poses for demo candidates) is legitimate. Run it early on Saturday as a fallback for the live on-demand demo.
- **AI tools:** list every AI coding assistant in the GenAI field. Separately describe the LLM APIs used in the product: Snowflake Cortex models, plus Gemini if added.
- **Deliverables to plan for:**
  - a public GitHub repo, kept public after the event;
  - Devpost with all relevant prize opt-ins;
  - a ≤2-minute demo video as a backup even though it is not required;
  - a laptop demo that runs offline-tolerant from cache if the venue Wi-Fi or GPU fails.
- **Judging format:** expect table/expo judging, a few minutes per judge visit, with possible finalist demos at closing (about 3–5 min). Prepare a 60–90-second walkthrough of the end-to-end flow and a 3-minute version.
- **Project-count estimate (speculative):** if roughly 250–400 hackers check in, MLH's 1-project-per-4-hackers rate implies about 60–100 projects. That is my arithmetic on assumed attendance.

### Gaps
- OxHack has not said whether it adopts MLH's Standard Hackathon Rules verbatim, or whether it caps the number of sponsor tracks per project.
- The actual Devpost submission form (custom questions, video field) needs login and was not inspected.
- Judging format, minutes per team, finalist round and expo hall layout are unpublished.
- Whether an MLH 2026–27 version of the Contest Terms changes the criteria is unconfirmed.

---

## Q5. Are there theme tracks (e.g. health/biotech, AI, finance, data) that this project fits? How should the project be framed and scoped to maximise HRT, overall and sponsor wins?

### Takeaway
There are no theme tracks. The main challenge is "Build something (anything!)", tagged Open Ended and Beginner Friendly. The project's natural targets are:
- **HRT data/predictions/decisions:** best fit.
- **First Place and Runner Up:** judged on Creativity, Technicality, Completeness and Presentation/Hackathon Spirit.
- **MLH Snowflake API:** the model jury.
- **MLH Tiger Data:** experiment history, if Tiger-specific features are used.
- **MLH Vultr:** if docking runs on a Vultr Cloud GPU.
- **MLH Gemini API:** if Gemini joins the jury through the Gemini API.

Health, Presage, Solana, ElevenLabs, Hackiest and Handmade are weak fits.

### Cited Findings
- No required theme; Devpost tags are "Beginner Friendly" and "Open Ended". — [Devpost overview](https://oxhack-2026.devpost.com/); [Devpost hackathon API](https://devpost.com/api/hackathons?search=oxhack)
- **Snowflake:** "Play with industry-leading LLMs on a single account using the Snowflake APIs… as simple as a single CURL command to Snowflake's REST API… embed AI-powered features into your app." — [Devpost overview](https://oxhack-2026.devpost.com/)
- **Tiger Data:** wants "the most innovative, impactful, and performance-driven use of Tiger Data". Its highlighted features are time-series/"high-frequency metric streams", "Continuous Aggregates" for "lag-free, real-time frontend charts", and "90%+ Data Compression". Examples include "AI-driven analytics dashboards, or financial prediction engines". — [Devpost overview](https://oxhack-2026.devpost.com/)
- **Vultr:** "specialized Vultr Cloud GPUs that can power AI-driven applications… push the limits of what can be built when infrastructure is no longer the bottleneck! … claim your free cloud credits!" — [Devpost overview](https://oxhack-2026.devpost.com/)
- **Gemini:** example use: "Analyze info like a supercomputer and create an app that summarizes complex research papers". — [Devpost overview](https://oxhack-2026.devpost.com/)
- **Delta (Zed):** needs Delta used "from brainstorming/ideation, building, all the way through testing" with shared threads. Scored 30% on speed and performance. — [Devpost overview](https://oxhack-2026.devpost.com/)
- **DEV Writing Challenge:** $100 for a post on DEV, chosen monthly by the DEV editorial team. — [MLH event page](https://www.mlh.com/events/oxhack-26)
- **Biomedical precedent:** a biomedical research data tool (STIK, glioblastoma spheroid invasion) won HRT's "Best Use of Data" at TreeHacks 2025. — [STIK GUI](https://devpost.com/software/tumor-invasion-kinetics-gui)

### Inferences
**Positioning**
- One-line pitch: "A decision engine that predicts which already-approved drugs are worth investigating for a disease. It fuses Open Targets, ChEMBL and PubChem evidence, gets a jury of LLMs to rank independently, measures their agreement, and lets you test the top bet with on-demand docking. It is backtested on a known answer."
- This one framing serves HRT (data → prediction → decision), the overall criteria (creative LLM-jury idea, technical pipeline, complete demo) and Snowflake.

**Scope in priority order** (cut from the bottom when time runs out)
1. **Must ship:** disease search → evidence pipeline → baseline score → Snowflake Cortex jury (3–4 models) → consensus plus agreement metrics → ranked shortlist with evidence cards. Include the COVID-19/baricitinib backtest with direct evidence masked, and multiple myeloma as the "discovery" example. This alone covers HRT, Snowflake and the overall prizes.
2. **Should ship:** experiment history in Tiger Cloud.
   - To be competitive for Tiger Data, store each jury vote, docking job and status event as time-series rows in a hypertable.
   - Drive a live "runs/agreement over time" panel from a continuous aggregate, and mention compression.
   - Plain CRUD is unlikely to win "performance-driven use".
3. **Should ship:** docking for one pre-prepared target per demo disease, run on a Vultr Cloud GPU so the team is eligible for Vultr. DGX Spark or local runs would not count for Vultr.
   - Pre-compute poses during the event for the demo candidates, and show them in a 3D viewer (for example Mol*/3Dmol.js).
   - Keep "dock now" live, with the cache as a fallback.
4. **Nice to have:** Gemini as one jury member through the Gemini API, for MLH Gemini eligibility. Gemini could also produce a cited "evidence summary" per candidate.
5. **Skip or optional:** ElevenLabs narration (gimmick), Delta (only if the team works in it from the start), Presage, Solana, Hackiest Hack, Best Handmade.
6. **Post-event:** a DEV write-up for the $100 DEV Writing Challenge.

**Demo script for the expo** (MLH: judged on what you built, demo over pitch)
- Open on the backtest: "With direct COVID evidence hidden, the jury still ranks baricitinib #k of N, and here is where the models disagree."
- Then the multiple-myeloma run, live.
- Then dock the top candidate, or show the cached pose, and show the decision label updating.
- Finish with the agreement metrics and the evidence provenance.
- Keep a Sunday-morning screen recording of 2 minutes or less as backup.

**Opt-in list on Devpost:** First Place/Runner Up (automatic or general), HRT, Snowflake API, Tiger Data, Vultr, and Gemini if used. Each needs visible, real use in the demo and README. MLH judges check "Best Use of", not mere presence.

**Risk control**
- The biggest threat to "Completeness" is the docking stack. Use a time-box: if DiffDock is not running on the GPU by Saturday evening, switch to Vina, or to cached runs only.
- Second threat: the clock change and an unclear deadline. Submit a complete draft early. Devpost normally lets you edit until the deadline, but I have not confirmed that for this event.

### Gaps
- Unknown whether Snowflake judges will count Cortex models called through the Snowflake REST API as "Snowflake API" use. The prize text strongly suggests yes, but the linked "repository" could not be resolved because the mlh.link redirects failed.
- Unknown whether OxHack caps the number of prize opt-ins per project.
- Unknown whether Entangl, Jane Street, OxAM or Talos will announce on-site challenges that fit better, for example a quant or data challenge. Watch the opening ceremony and Discord.
