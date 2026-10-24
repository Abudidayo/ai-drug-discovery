# Shared hackathon skills

Use [skills.md](../skills.md) for installation, usage and the skill list.
This guide records sources, adaptations and technical details.

The fifteen selected skills are stored in `skills/`. These are actual copies,
including their supporting resources, with no dependency on the original
author's home directory. `.claude/skills/` contains relative aliases to the same
folders, following the nv-fabric layout.

| Skill | What it helps with | Source |
| --- | --- | --- |
| `impeccable` | UI design, review, accessibility, empty states and polish | Installed Impeccable 4.6.0; [upstream](https://github.com/pbakaus/impeccable) |
| `emil-design-eng` | Interaction details, component behavior and motion | Existing personal skill |
| `deep-research` | Source-backed research and narrative reports | Existing personal skill, including researcher and report-writer references |
| `trail-init-local` | Trail-Code setup with shared project learnings and an optional local-only mode | Adapted from the existing local skill; [upstream CLI](https://github.com/trailhq/Trail-Code) |
| `archify` | Architecture, sequence, data-flow and state diagrams | nv-fabric's imported Archify 2.15 package; included MIT license |
| `eli5` | Explanations adapted to an audience | Adapted from nv-fabric's imported skill; the command is `/eli5`, not `/elif5` |
| `handoff` | Pass decisions, interfaces and unfinished work to another agent | nv-fabric's imported skill, including explicit-only invocation policy |
| `diagnosing-bugs` | Reproduce and isolate bugs and performance regressions | nv-fabric's imported skill, including its human-feedback loop template |
| `ponytail` | Keep the implementation simple and focused on the MVP | nv-fabric's imported skill |
| `software-engineering-principles` | Consistent coding, reliability and maintenance guidance | nv-fabric's shared engineering guidance |
| `ui-engineering-principles` | Consistent interface behavior, accessibility and responsive states | nv-fabric's shared UI guidance |
| `code-review` | Review the diff against standards and the originating spec | Adapted from nv-fabric to work without its tracker setup |
| `break-ui` | Stress-test UI with realistic worst-case data and states | Existing personal skill, including its edge-case catalog |
| `i-have-adhd` | Action-first responses, numbered steps and visible progress | Installed ayghri/i-have-adhd plugin 0.4.1; [upstream](https://github.com/ayghri/i-have-adhd); included MIT license |
| `caveman` | Concise answers with exact code, commands and technical facts | [JuliusBrussee/caveman v4.0.1](https://github.com/JuliusBrussee/caveman/tree/v4.0.1/skills/caveman), commit `d262ab3882952a59312ff3537cd86d894523c5ab`; included Apache 2.0 license and upstream notices |

## Use and share

The agent installation entry point is [skills.md](../skills.md). Give the agent
the complete bundle and say: **Read `skills.md` and set everything up.**
The included `.agents/install-skills.py` copies all supporting files,
keeps identical existing skills, reports conflicting definitions before copying,
and creates Claude Code aliases (or copies if symlinks are unavailable).
It also appends a Trail reply preference to the project's `AGENTS.md`, which
`CLAUDE.md` imports with `@AGENTS.md`, preserving existing content and avoiding
duplicate blocks. It suppresses Trail closing lines. A shared standing preference is
also installed in `.trail/learnings/` so Trail's startup guidance carries the
team's choice. Existing learnings are never overwritten. Restart existing
agent sessions to load it; Trail's code map and learning workflows stay active.

Check the installer with `python3 .agents/test_install_skills.py`.

Keep both `.agents/` and `.claude/skills/` when copying this bundle to another
repository. Review any existing folders before copying; do not overwrite a
teammate's skills. Sharing these files does not require sharing personal agent
configuration, transcripts, credentials or caches.

- Codex discovers `.agents/skills/`. Invoke a skill with `$skill-name`.
- Claude Code discovers the aliases in `.claude/skills/`. Invoke one with
  `/skill-name`.
- If a new skill does not appear, start a new agent session. Agents can also
  select applicable skills automatically.
- Other tools can read the individual `SKILL.md` files; automatic discovery
  depends on the tool.
- Handoff remains explicit-only: request `/handoff` in Claude Code or `$handoff`
  in Codex. Its Claude frontmatter and Codex invocation policy are both included.
- I Have ADHD also remains explicit-only: request `/i-have-adhd` in Claude Code
  or `$i-have-adhd` in Codex. Its style guidance stays active until the user
  says `stop adhd mode` or `normal mode`.

Discovery references: [OpenAI documentation](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills)
and [Claude Code documentation](https://code.claude.com/docs/en/skills#choose-where-skills-load).

Runtime notes:

- Archify needs Node.js 18 or newer. Its packaged runtime works without an npm
  install: `node .agents/skills/archify/bin/archify.mjs doctor`. Its upstream
  development/release scripts are not an application test suite.
- Impeccable includes its launcher and references. The launcher can download
  its version-pinned native engine on first use. Its manifest's version and
  argument hint were moved into standard `metadata`; its default invocation
  behavior and instructions are preserved. The upstream Apache 2.0 license is
  included.
- Deep Research's supplied workflow uses research subagents. It needs an agent
  runtime that supports delegation and web/source access; its description
  specifies direct research as the fallback when delegation is unavailable.
- ELI5's guidance now preserves factual accuracy and meaningful caveats when
  simplifying, matching the project's accuracy preference. The original line
  accepting an explanation at 80% accuracy was replaced.
- Code Review accepts a supplied issue/spec or local project documentation;
  it does not require `setup-matt-pocock-skills` or a specific issue tracker.
  It keeps standards and spec findings separate, supports a sequential fallback
  when delegation is unavailable, and includes uncommitted work when requested.
- Handoff and Ponytail retain their supported Claude-specific frontmatter.
  Handoff's `agents/openai.yaml` preserves its explicit-only policy in Codex.
- Break UI includes `CATALOG.md` and works with the skills already in the pack.
  Its references to `prototype` and `review-animations` describe neighboring
  workflows; those skills are not required for its stress-testing workflow.
- I Have ADHD includes its installed skill instructions, Codex invocation
  metadata, Gemini command template and upstream license. This bundle contains
  the command skill; the plugin's always-on hooks and personal plugin data
  are not included.
- Caveman includes the upstream `caveman` skill and its license notices.
  It is off by default because full replies are easier to read. Say
  `/caveman` to use it in a session and `stop caveman` to turn it off. Its optional
  `ultracave` and `megacave` sibling skills, runtime, proxy and startup hooks
  are not part of this pack.
- Trail-Code is installed separately on each teammate's machine. The bundled
  helper previews changes with `--dry-run`, initializes repository wiring with
  `--no-global` and keeps legacy `graft/` in local Git excludes. Current Trail
  versions ignore their map at `.trail/cache/` through `.trail/.gitignore`.
  Its default team mode leaves learnings available for review and sharing through Git, and removes
  the helper's legacy `.trail/` exclusions. Personal preferences stay in each
  person's `~/.trail/`. The installer copies files only; `skills.md` then tells
  the agent to initialize Trail on that teammate's machine and checkout.
  User-level MCP registration and lifecycle hooks are outside this project's
  `--no-global` setup. The agent can use the CLI and project instructions.
  Setup does not publish learnings.
- For solo work, append `--local-only` to keep untracked `.trail/` learnings
  locally ignored as well. Combine it with `--dry-run` to preview that mode.
  The helper refuses local-only mode when `.trail/` is already tracked and
  reports other ignore rules that block team sharing. Neither mode stages or
  commits files. Git linked worktrees share the clone's local excludes.

## nv-fabric inventory and selected additions

Verified against the local main checkout of nv-fabric and its existing
Conductor worktrees on 2026-10-24. This is an inventory of available skills,
not a measurement of invocation frequency.

The main checkout contains 18 repository skills:

| Purpose | Skills |
| --- | --- |
| Default engineering guidance | `software-engineering-principles`, `ui-engineering-principles` |
| Planning and design | `grill-me`, `grilling`, `ponytail`, `codebase-design`, `to-spec`, `to-tickets` |
| Build, diagnose and review | `implement`, `diagnosing-bugs`, `tdd`, `code-review`, `conductor-pr-review` |
| Explain, diagram and hand over | `eli5`, `archify`, `handoff` |
| Workflow setup | `setup-matt-pocock-skills`, `next-verse-delivery-guide` |

Some worktrees additionally contain `codeguard`, `frontend-design`,
`next-verse-ui`, `ui-ideation`, `verify` and `run-qa` (24 total). Other worktrees
have the first four additions (22 total). nv-fabric's `AGENTS.md` applies the
engineering principles to coding and the UI principles to frontend work;
the guided delivery workflow is optional.

The seven additions selected for this hackathon are now included:

| Priority | Skill | Benefit |
| --- | --- | --- |
| First | `handoff` | Transfer decisions, contracts, evidence and remaining work between teammates' agents |
| First | `diagnosing-bugs` | Reproduce and isolate API, docking, jury and integration failures |
| First | `ponytail` | Keep the build focused on the committed MVP |
| Next | `software-engineering-principles`, `ui-engineering-principles` | Shared coding and interface quality guidance |
| Next | `code-review` | Compare an implementation against the spec and coding standards; its issue-tracker setup dependency has been removed |
| Optional | `break-ui` | Exercise missing evidence, long drug names, empty results and failed or running docking states; available as a personal skill |

The bundle contains the original six skills, these seven additions,
`i-have-adhd` and `caveman`: fifteen skills in total. Next Verse's UI brand rules, deployment checks and
tracker workflow have not been imported. LinkedIn skills are excluded.
