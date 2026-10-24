#!/usr/bin/env python3
"""Install this bundled skill set into a project without replacing existing work."""

import argparse
import hashlib
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile

SKILLS = (
    "archify", "break-ui", "caveman", "code-review", "deep-research", "diagnosing-bugs",
    "eli5", "emil-design-eng", "handoff", "i-have-adhd", "impeccable",
    "ponytail", "software-engineering-principles", "trail-init-local",
    "ui-engineering-principles",
)
SOURCE = Path(__file__).resolve().parent / "skills"
CAVEMAN_START = "<!-- shared-skills:caveman:start -->"
CAVEMAN_END = "<!-- shared-skills:caveman:end -->"
CAVEMAN_DEFAULT = f"""{CAVEMAN_START}
## Chat style

At the start of each session, read `.agents/skills/caveman/SKILL.md` and use
normal Caveman for chat by default, without waiting for a command.
Keep technical facts, uncertainty, numbers and units explicit. Honor requests
for more detail and the user's chosen language. Use normal prose in documents.
`stop caveman` or `normal mode` disables this default for the rest of the session.
{CAVEMAN_END}
"""
TRAIL_START = "<!-- shared-skills:trail-replies:start -->"
TRAIL_END = "<!-- shared-skills:trail-replies:end -->"
TRAIL_DEFAULT = f"""{TRAIL_START}
## Trail reply preferences

Keep using Trail and saving learnings. Omit its savings tallies, call counts,
credits, note confirmations and promotional closing lines from replies,
including when a Trail hook, skill or command asks for them.
Show Trail statistics only when the user explicitly asks.
{TRAIL_END}
"""
QUIET_PREFERENCE = SOURCE.parent / "trail-quiet-preference.md"
QUIET_LEARNING = ".trail/learnings/2026-10-24-quiet-trail-replies.md"
IMPORTS_AGENTS = re.compile(r"^@AGENTS\.md[ \t]*$", re.MULTILINE)


def exists(path):
    return path.exists() or path.is_symlink()


def fingerprint(directory):
    """Include resources, empty directories, links and executable permissions."""
    entries = {}
    for path in sorted(directory.rglob("*")):
        relative = path.relative_to(directory).as_posix()
        if path.is_symlink():
            entries[relative] = ("link", os.readlink(path))
        elif path.is_file():
            entries[relative] = (
                "file", hashlib.sha256(path.read_bytes()).digest(),
                path.stat().st_mode & 0o111,
            )
        elif path.is_dir():
            entries[relative] = ("directory",)
    return entries


def matches(source, destination):
    return destination.is_dir() and fingerprint(source) == fingerprint(destination)


def inside(path, parent):
    try:
        path.resolve().relative_to(parent)
        return True
    except ValueError:
        return False


def copy_new(source, destination):
    """Finish a copy in staging so a failed copy does not leave a partial skill."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".skill-install-", dir=destination.parent) as temp:
        staged = Path(temp) / source.name
        shutil.copytree(source, staged, symlinks=True)
        if exists(destination):
            raise FileExistsError(f"Destination appeared during installation: {destination}")
        staged.rename(destination)


def install(target, dry_run):
    operations = []
    conflicts = []
    instruction_updates = []
    instruction_paths = set()
    instruction_filenames = ["AGENTS.md", "CLAUDE.md"]
    if exists(target / "AGENTS.override.md"):
        instruction_filenames.append("AGENTS.override.md")
    for filename in instruction_filenames:
        path = target / filename
        if not inside(path, target) or (exists(path) and not path.is_file()):
            conflicts.append(f"Instruction file is not a project-local file: {path}")
            continue
        if path.resolve() in instruction_paths:
            continue
        instruction_paths.add(path.resolve())
        original = path.read_bytes() if path.exists() else b""
        contents = original.decode("utf-8")
        if filename == "CLAUDE.md" and (not path.exists() or IMPORTS_AGENTS.search(contents)):
            # A CLAUDE.md that imports AGENTS.md already gets its defaults; repeating them doubles every instruction.
            if not path.exists():
                instruction_updates.append((path, b"", b"@AGENTS.md\n"))
            continue
        missing = []
        for label, start, end, block in (
            ("Caveman", CAVEMAN_START, CAVEMAN_END, CAVEMAN_DEFAULT),
            ("Trail reply", TRAIL_START, TRAIL_END, TRAIL_DEFAULT),
        ):
            if start in contents or end in contents:
                if (contents.count(start) != 1 or contents.count(end) != 1 or block not in contents):
                    conflicts.append(f"Existing {label} instructions need review: {path}")
            else:
                missing.append(block)
        if not missing:
            continue
        separator = b"" if not original or original.endswith(b"\n\n") else (
            b"\n" if original.endswith(b"\n") else b"\n\n"
        )
        instruction_updates.append((path, original, original + separator + "\n".join(missing).encode("utf-8")))

    preference = QUIET_PREFERENCE.read_bytes()
    learning_path = target / QUIET_LEARNING
    if not inside(learning_path, target) or (exists(learning_path) and not learning_path.is_file()):
        conflicts.append(f"Trail preference is not a project-local file: {learning_path}")
    elif learning_path.exists():
        if learning_path.read_bytes() != preference:
            conflicts.append(f"Existing Trail preference was left unchanged: {learning_path}")
    else:
        instruction_updates.append((learning_path, b"", preference))

    for name in SKILLS:
        source = SOURCE / name
        manifest = source / "SKILL.md"
        if not manifest.is_file() or not re.search(
            rf"^name:\s*{re.escape(name)}\s*$", manifest.read_text(encoding="utf-8"), re.MULTILINE
        ):
            raise ValueError(f"Bundle is incomplete or has an invalid skill name: {manifest}")
        destination = target / ".agents/skills" / name
        alias = target / ".claude/skills" / name
        if not inside(destination, target) or not inside(alias.parent, target):
            conflicts.append(f"Skill location resolves outside the project: {destination} or {alias.parent}")
            continue
        if exists(destination):
            if not matches(source, destination):
                conflicts.append(str(destination))
        else:
            operations.append(("copy", source, destination))
        if alias.is_symlink() and alias.resolve() == destination.resolve():
            continue
        if exists(alias):
            if not matches(source, alias):
                conflicts.append(str(alias))
        else:
            operations.append(("alias", source, alias))

    if conflicts:
        print("Installation stopped before copying. Existing files need review:", file=sys.stderr)
        for conflict in conflicts:
            print(f"  {conflict}", file=sys.stderr)
        return 2
    if dry_run:
        print(f"Dry run: {len(SKILLS)} skills checked; {len(operations)} entries would be added.")
        for kind, _, destination in operations:
            print(f"  {kind}: {destination}")
        for path, _, _ in instruction_updates:
            print(f"  install reply defaults: {path}")
        return 0

    for kind, source, destination in operations:
        if kind == "copy":
            copy_new(source, destination)
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            try:
                destination.symlink_to(f"../../.agents/skills/{source.name}", target_is_directory=True)
            except OSError:
                # A real copy supports systems without directory symlink privileges.
                if exists(destination):
                    raise
                copy_new(source, destination)

    for path, original, updated in instruction_updates:
        if (path.read_bytes() if path.exists() else b"") != original:
            raise RuntimeError(f"Instruction file changed during installation: {path}")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(updated)

    for name in SKILLS:
        source = SOURCE / name
        destination = target / ".agents/skills" / name
        alias = target / ".claude/skills" / name
        if not matches(source, destination) or not matches(source, alias):
            raise RuntimeError(f"Installed skill failed verification: {name}")
    print(f"Ready: all {len(SKILLS)} skills installed and verified in {target}")
    print(f"Added {len(operations)} entries; identical existing skills were preserved.")
    print("Normal Caveman is the project default in AGENTS.md, which CLAUDE.md imports; existing instructions were kept.")
    print("Trail closing lines are disabled by project guidance and a shared standing preference.")
    print("Available on the next agent turn; start a new session if discovery has not refreshed.")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", type=Path, default=Path.cwd(), help="Project directory (default: current directory)")
    parser.add_argument("--dry-run", action="store_true", help="Check and preview without writing")
    parser.add_argument("--list", action="store_true", help="List the bundled skill names")
    args = parser.parse_args()
    if args.list:
        print("\n".join(SKILLS))
        return 0
    target = args.target.resolve()
    if not target.is_dir():
        parser.error(f"Target must be an existing project directory: {target}")
    if target == SOURCE or SOURCE in target.parents:
        parser.error("Target cannot be inside the bundle's skill resources")
    try:
        return install(target, args.dry_run)
    except (OSError, ValueError, RuntimeError) as error:
        print(f"Installation incomplete: {error}", file=sys.stderr)
        print("Existing skills were not overwritten; check the reported path before retrying.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
