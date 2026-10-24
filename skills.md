# Set up all 15 skills

Install the whole pack and set up Trail in the user's project.
Do not ask them to choose skills.

1. Find this file and `.agents/install-skills.py`. Extract the attached pack
   first if needed. If supporting files are missing, ask for the complete pack.
2. Find the user's project root. Run:

   ```sh
   python3 "/path/to/pack/.agents/install-skills.py" --target "/path/to/project"
   ```

   Replace both paths. Requires Python 3.9+. Add `--dry-run` for a preview.
   Stop on failure or conflicts and report the affected files.
3. If installation succeeds, read the project's
   `.agents/skills/trail-init-local/SKILL.md` and follow it. Install the Trail
   CLI if missing, preview the changes, then run its bundled setup helper.
   Each teammate needs this once per machine and checkout. An existing
   `.trail/` folder does not mean their local setup is ready.
4. Read `.agents/skills/caveman/SKILL.md` and use normal Caveman for chat now.
   The installer adds this default to `AGENTS.md` and `CLAUDE.md` for future
   sessions, preserving existing instructions. No manual trigger is needed.
   Keep Trail's savings, credit and promotional closing lines out of replies.
   The installer saves this as a shared standing preference too. Restart
   existing sessions to load it.
5. Verify the skills, automatic Caveman default and Trail setup. Report the
   installed count and any required agent restart. If anything fails or
   conflicts, name the problem;
   do not overwrite existing work or claim full success.

The installer copies all supporting files and sets up Claude Code and Codex
discovery. Identical existing skills are kept. Start a new agent session if
the skills do not appear.

Run other workflows when needed. Keep `handoff` and `i-have-adhd` opt-in.
Trail's helper uses `--no-global` to keep agent settings within the project.

## Included skills

| Skill | Purpose |
| --- | --- |
| `impeccable` | UI design and polish |
| `emil-design-eng` | Interactions and animation |
| `deep-research` | Research with sources |
| `trail-init-local` | Set up shared project memory |
| `archify` | Architecture and workflow diagrams |
| `eli5` | Explain things simply |
| `handoff` | Pass work to another agent |
| `diagnosing-bugs` | Find the cause of bugs |
| `ponytail` | Keep the build simple |
| `software-engineering-principles` | Coding quality |
| `ui-engineering-principles` | UI quality and accessibility |
| `code-review` | Check code against the spec |
| `break-ui` | Find UI edge cases |
| `i-have-adhd` | Clear, action-first responses |
| `caveman` | Automatic concise answers with technical details preserved |

## Use a skill

Claude Code uses `/skill-name`; Codex uses `$skill-name`.
Caveman starts automatically after setup. Use normal Caveman for clear team
communication. Ultra strips more grammar and is not the default or bundled.
Ask for more detail whenever needed. Say `stop caveman` to disable it for
the current session.

## Trail sharing

After the agent follows these instructions:

- `.trail/learnings/`: review and share project learnings through Git.
- `.trail/cache/` (older versions: `graft/`): keep the code map local.
- `~/.trail/`: keep personal preferences private.

Team sharing is the default. Use `--local-only` for solo work.
Nothing is committed or pushed automatically.
Trail stays active, with its closing lines hidden by default.

Each teammate can tell their agent: **Read `skills.md` and set everything up.**

[Sources and technical details](.agents/README.md)
