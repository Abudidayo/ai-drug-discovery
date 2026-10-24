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
    "archify", "break-ui", "code-review", "deep-research", "diagnosing-bugs",
    "eli5", "emil-design-eng", "handoff", "i-have-adhd", "impeccable",
    "ponytail", "software-engineering-principles", "trail-init-local",
    "ui-engineering-principles",
)
SOURCE = Path(__file__).resolve().parent / "skills"


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
        print("Installation stopped before copying. Existing skills need review:", file=sys.stderr)
        for conflict in conflicts:
            print(f"  {conflict}", file=sys.stderr)
        return 2
    if dry_run:
        print(f"Dry run: {len(SKILLS)} skills checked; {len(operations)} entries would be added.")
        for kind, _, destination in operations:
            print(f"  {kind}: {destination}")
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

    for name in SKILLS:
        source = SOURCE / name
        destination = target / ".agents/skills" / name
        alias = target / ".claude/skills" / name
        if not matches(source, destination) or not matches(source, alias):
            raise RuntimeError(f"Installed skill failed verification: {name}")
    print(f"Ready: all {len(SKILLS)} skills installed and verified in {target}")
    print(f"Added {len(operations)} entries; identical existing skills were preserved.")
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
