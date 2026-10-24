#!/bin/sh
set -eu

trail_local_only=false
trail_dry_run=false
for trail_arg in "$@"; do
  case "$trail_arg" in
    --local-only) trail_local_only=true ;;
    --dry-run) trail_dry_run=true ;;
    --help|-h)
      printf '%s\n' 'Usage: trail-init-local.sh [--local-only] [--dry-run]'
      printf '%s\n' 'Default: share repository learnings through Git; keep the code map local.'
      exit 0 ;;
    *) printf '%s\n' 'Usage: trail-init-local.sh [--local-only] [--dry-run]' >&2; exit 2 ;;
  esac
done

if ! command -v trail >/dev/null 2>&1; then
  printf '%s\n' 'Install Trail-Code first: npm install -g @trailhq/trail-code' >&2
  exit 127
fi

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  printf '%s\n' 'Run this from inside a Git repository.' >&2
  exit 2
}
cd "$repo_root"

if [ "$trail_local_only" = true ]; then
  if [ -n "$(git ls-files -- .trail)" ]; then
    printf '%s\n' 'Local-only setup stopped: .trail/ contains tracked files; ignore rules cannot make them private.' >&2
    printf '%s\n' 'Existing tracked files were left unchanged.' >&2
    exit 1
  fi
  printf '%s\n' 'Local-only mode: keep graft/ and untracked .trail/ learnings in local Git excludes.'
else
  printf '%s\n' 'Team mode: keep graft/ local and leave .trail/ available for review and sharing through Git.'
fi

if [ "$trail_dry_run" = true ]; then
  printf '%s\n' 'Dry run: no local ignore rules will be changed.'
  if [ "$trail_local_only" = false ]; then
    printf '%s\n' 'On setup, legacy .trail/ and /.trail/ entries will be removed from local Git excludes.'
  fi
  exec trail init --dry-run --agents claude agents --no-global
fi

# Keep user-level agent settings untouched. A failed init stops before this
# helper changes Git excludes or prints a completion message.
trail init --agents claude agents --no-global

exclude_file=$(git rev-parse --path-format=absolute --git-path info/exclude)
mkdir -p "$(dirname "$exclude_file")"
touch "$exclude_file"
if ! grep -Fqx -e '/graft/' -e 'graft/' "$exclude_file"; then
  printf '\n%s\n' '/graft/' >> "$exclude_file"
fi

if [ "$trail_local_only" = true ]; then
  if ! grep -Fqx -e '/.trail/' -e '.trail/' "$exclude_file"; then
    printf '\n%s\n' '/.trail/' >> "$exclude_file"
  fi
else
  # Migrate the two exact rules written by earlier local-only helpers.
  # Preserve unrelated rules, comments, file permissions and symlinks.
  if grep -Fqx -e '/.trail/' -e '.trail/' "$exclude_file"; then
    trail_exclude_tmp=$(mktemp "${exclude_file}.trail-init.XXXXXX")
    trap 'rm -f "$trail_exclude_tmp"' 0
    awk '$0 != ".trail/" && $0 != "/.trail/"' "$exclude_file" > "$trail_exclude_tmp"
    cat "$trail_exclude_tmp" > "$exclude_file"
  fi

  trail_ignore_status=0
  git check-ignore --quiet --no-index -- .trail/learnings/__trail_share_check__.md || trail_ignore_status=$?
  case "$trail_ignore_status" in
    0)
      printf '%s\n' 'Team setup incomplete: repository learnings are still ignored by another rule:' >&2
      git check-ignore -v --no-index -- .trail/learnings/__trail_share_check__.md >&2 || true
      printf '%s\n' 'Review that rule before sharing .trail/. No files were staged or committed.' >&2
      exit 1 ;;
    1) ;;
    *) printf '%s\n' 'Could not verify whether repository learnings are ignored.' >&2; exit 1 ;;
  esac
fi

printf '%s\n' 'Trail-Code initialization finished. Review integration changes:'
git status --short
printf '\n%s\n' 'Already tracked Trail data:'
git ls-files -- graft .trail
printf '\n%s\n' 'Local ignore rules:'
git check-ignore -v -- graft/ .trail/ || true
if [ "$trail_local_only" = false ]; then
  printf '\n%s\n' 'Review repository learnings before committing them. Personal preferences stay in ~/.trail/.'
fi
