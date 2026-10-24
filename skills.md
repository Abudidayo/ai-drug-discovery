# Install all 14 skills

Install the whole pack in the user's project. Do not ask them to choose skills.

1. Find this file and `.agents/install-skills.py`. Extract the attached pack
   first if needed. If supporting files are missing, ask for the complete pack.
2. Find the user's project root. Run:

   ```sh
   python3 "/path/to/pack/.agents/install-skills.py" --target "/path/to/project"
   ```

   Replace both paths. Requires Python 3.9+. Add `--dry-run` for a preview.
3. Report the installed count. If there are conflicts, name the files and stop;
   do not overwrite them or claim installation succeeded.

The installer copies all supporting files and sets up Claude Code and Codex
discovery. Identical existing skills are kept. Start a new agent session if
the skills do not appear.

Install the files only. Run individual workflows when needed. Keep `handoff`
and `i-have-adhd` opt-in; leave machine-wide settings unchanged.

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

## Use a skill

Claude Code uses `/skill-name`; Codex uses `$skill-name`.

## Trail sharing

When `trail-init-local` is used:

- `.trail/`: review and share project learnings through Git.
- `graft/`: keep the generated code map local.
- `~/.trail/`: keep personal preferences private.

Team sharing is the default. Use `--local-only` for solo work.
Nothing is committed or pushed automatically.

[Sources and technical details](.agents/README.md)
