#!/usr/bin/env bash
# Build a static libSDL3.a and place it in ./lib so the engine links SDL3
# statically. The rest of the executable still links the system runtime and
# GPU/audio drivers dynamically, which SDL requires on Linux.
#
# Usage:
#   ./scripts/build-sdl3-static.sh [path-to-SDL-source]
#   SDL_SRC=/path/to/SDL ./scripts/build-sdl3-static.sh
set -euo pipefail

cd "$(dirname "$0")/.."

SDL_SRC="${1:-${SDL_SRC:-$HOME/Temp/sdl3/SDL}}"
BUILD_DIR="${SDL_BUILD_DIR:-$SDL_SRC/build-static}"
JOBS="$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)"

if [ ! -d "$SDL_SRC" ]; then
    echo "error: SDL3 source not found at $SDL_SRC" >&2
    echo "       pass the path as the first argument or set SDL_SRC" >&2
    exit 1
fi

cmake -S "$SDL_SRC" -B "$BUILD_DIR" \
    -DCMAKE_BUILD_TYPE=RelWithDebInfo \
    -DSDL_STATIC=ON \
    -DSDL_SHARED=OFF \
    -DSDL_TESTS=OFF \
    -DSDL_EXAMPLES=OFF \
    -DSDL_INSTALL=OFF \
    -DSDL_VULKAN=ON \
    -DSDL_WAYLAND=ON \
    -DSDL_X11=ON

cmake --build "$BUILD_DIR" -j"$JOBS"

mkdir -p lib
cp "$BUILD_DIR/libSDL3.a" lib/libSDL3.a
echo "Installed static SDL3 at ./lib/libSDL3.a"
