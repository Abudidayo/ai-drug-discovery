---
name: trail-init-local
description: Set up Trail-Code in a Git repository for Claude Code and Codex, sharing repository learnings through Git by default while keeping the generated code map local. Use when asked to initialize or configure Trail-Code, including an optional local-only setup.
---

# Set up Trail-Code for a team

This is the portable version of the setup skill. Its helper ships in
`scripts/trail-init-local.sh`; it does not depend on a helper in anyone's home
directory. The upstream CLI is [Trail-Code](https://github.com/trailhq/Trail-Code).

The default is a local CLI installation with shared repository learnings:

| Data | Location | Handling |
| --- | --- | --- |
| Project decisions, contracts and discoveries | Repository's `.trail/` | Review and share through Git |
| Generated code map | Each clone's `graft/` | Keep locally ignored |
| Personal preferences and machine setup | Each person's `~/.trail/` | Keep private; do not copy into the repository |

Use `--local-only` only when the user wants repository learnings kept out of
commits as well. Keep the skill's existing name for compatibility.

1. Resolve the repository root with `git rev-parse --show-toplevel` and inspect
   `git status --short`. Preserve existing changes, staged files, instructions
   and MCP configuration. If existing `.trail/` learnings were previously kept
   local, review their content before recommending that they be shared.
2. Check `command -v trail`. If it is missing, install the machine-local CLI
   with `npm install -g @trailhq/trail-code`; do not add it to app dependencies.
   This helper requires an upstream version supporting `init --no-global`.
   If the installed version lacks that flag, report the required update rather
   than silently falling back to machine-wide configuration changes.
3. Select the default team setup unless the user requests local-only behavior.
   From the repository, preview the wiring with
   `sh <skill-base-dir>/scripts/trail-init-local.sh --dry-run`, replacing
   `<skill-base-dir>` with the directory containing this `SKILL.md`. Review
   conflicts before proceeding. The helper selects `claude` and `agents`
   (the upstream ID for Codex), and passes `--no-global` to keep configuration
   within this repository. For the alternative mode, append `--local-only`
   to both the preview and the actual setup command. A preview does not change
   the helper's ignore rules.
4. Run `sh <skill-base-dir>/scripts/trail-init-local.sh` with the selected flags.
   Both modes initialize the two agents and locally exclude `/graft/` using
   `git rev-parse --git-path info/exclude`.
   Team mode removes the exact legacy `.trail/` and `/.trail/` entries from
   that file, preserving unrelated rules. It reports a failure if another rule
   still blocks repository learnings, rather than silently changing shared or
   global ignore files. Local-only mode adds `/.trail/`; it refuses when
   `.trail/` already contains tracked files, since ignoring cannot make those
   files private. Repeated setup does not add duplicate exclude entries.
5. Inspect `git status --short`, `git diff`,
   `git ls-files -- graft .trail` and
   `git check-ignore -v -- graft/ .trail/`. Excludes do not hide already
   tracked data or changes to tracked integration files. In team mode, verify
   that `.trail/learnings/` is available to Git and review the learnings before
   proposing a commit. Report exactly what changed, which data remains tracked
   and any required agent restart.

Do not stage, commit, push, hide edits with Git index flags or remove existing
tracked files. Initialization can update integration files such as `AGENTS.md`,
`.mcp.json`, `.claude/skills/trail/SKILL.md`, `.gitignore` and `.ignore`; leave
them available for review. Do not report failed initialization as success.

The setup makes repository learnings available for sharing; it does not publish
them. Actual sharing happens when the user commits and pushes reviewed `.trail/`
files. Each teammate installs Trail locally and builds their own code map.
Personal data in `~/.trail/` is left untouched. Git linked worktrees share the
clone's `info/exclude`, so changing modes affects all of that clone's worktrees.

Do not install local-only exclusions as a fallback after a failed team setup,
or claim that tracked learnings have become private. Report the blocking rule
or tracked files and leave the user's content and Git index intact.

Finish with a short report of the agent wiring, local exclusions, tracked
changes and any remaining failure. Follow the user's reply preferences;
automatically generated Trail closing lines are not required.
