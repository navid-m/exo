#!/usr/bin/env bash
# Compile the GLSL shaders to SPIR-V (used on Linux/Windows).
# Requires glslangValidator (package: glslang-tools on Debian/Ubuntu).
set -euo pipefail

cd "$(dirname "$0")/.."

shopt -s nullglob
files=(assets/shaders/*.vert assets/shaders/*.frag)
if [ ${#files[@]} -eq 0 ]; then
    echo "error: no shader sources found in assets/shaders" >&2
    exit 1
fi

for src in "${files[@]}"; do
    echo "  $src -> $src.spv"
    glslangValidator -V "$src" -o "$src.spv"
done
