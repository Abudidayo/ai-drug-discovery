#!/usr/bin/env bash
# Runs once when the codespace or dev container is created.
set -euo pipefail
cd "$(dirname "$0")/.."

sudo apt-get update
sudo apt-get install -y --no-install-recommends postgresql-client

if [[ -f pyproject.toml ]]; then
  uv sync
fi

# Docking toolchain (docs/build-reference.md C1-C6), kept apart from the project
# venv so `uv sync` never removes it. Move it into a `docking` dependency group
# once the worker has a pyproject.toml.
uv venv --allow-existing --python /usr/local/bin/python "$DOCKING_VENV"
uv pip install --python "$DOCKING_VENV/bin/python" -r .devcontainer/docking-requirements.txt

# remoteEnv puts the venv first, but login shells re-prepend the image's
# Python in /etc/profile.d, so put it first again in interactive shells.
for rc in ~/.bashrc ~/.zshrc; do
  grep -qs 'DOCKING_VENV/bin' "$rc" || echo 'export PATH="$DOCKING_VENV/bin:$PATH"' >> "$rc"
done

sudo mkdir -p "$RESULTS_DIR"
sudo chown "$(id -u):$(id -g)" "$RESULTS_DIR"

"$DOCKING_VENV/bin/python" -c '
import gemmi, meeko, rdkit, vina
print(f"vina {vina.__version__}, meeko {meeko.__version__}, rdkit {rdkit.__version__}, gemmi {gemmi.__version__}")
'
