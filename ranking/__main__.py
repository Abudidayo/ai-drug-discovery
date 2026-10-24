"""Run with python -m ranking build ... or python -m ranking inspect ..."""

import argparse
from collections import Counter
import json
from pathlib import Path
import sys

from .artifacts import build_artifacts, load_artifacts


def main() -> int:
    parser = argparse.ArgumentParser(description="Build/reload the Stage 1 protein-network foundation")
    commands = parser.add_subparsers(dest="command", required=True)
    build = commands.add_parser("build", help="Build graph and reusable largest-component distances")
    build.add_argument("--mapping", type=Path, required=True)
    build.add_argument("--links", type=Path, required=True)
    build.add_argument("--output", type=Path, required=True, help="New artifact directory (never overwritten)")
    build.add_argument("--min-combined-score", type=int, default=700)
    build.add_argument("--min-experiments", type=int, default=400)
    build.add_argument("--chunk-size", type=int, default=128)
    build.add_argument("--dtype", choices=("uint8", "uint16"), default="uint8")
    inspect = commands.add_parser("inspect", help="Verify checksums and reload saved artifacts")
    inspect.add_argument("directory", type=Path)
    args = parser.parse_args()

    def progress(done: int, total: int) -> None:
        print(f"Distances: {done}/{total} rows", file=sys.stderr, flush=True)

    try:
        if args.command == "build":
            manifest = build_artifacts(
                args.mapping, args.links, args.output,
                min_combined_score=args.min_combined_score, min_experiments=args.min_experiments,
                chunk_size=args.chunk_size, dtype=args.dtype, progress=progress,
            )
        else:
            with load_artifacts(args.directory) as artifacts:
                manifest = artifacts.manifest
        # Keep thousands of isolated component sizes in the on-disk manifest,
        # while showing their complete histogram in terminal output.
        summary = dict(manifest)
        summary["graph"] = dict(manifest["graph"])
        sizes = summary["graph"].pop("component_sizes_descending")
        summary["graph"]["component_size_counts"] = dict(Counter(sizes))
        print(json.dumps(summary, indent=2, sort_keys=True))
    except (OSError, ValueError, OverflowError, KeyError) as error:
        print(f"Stage 1 failed: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
