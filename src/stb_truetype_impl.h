/*
 * Instantiates stb_truetype's implementation in the compiler-generated C shim.
 * The engine's font logic itself lives in src/engine/font.sx and calls the
 * public stbtt_* API directly.
 */
#ifndef EXO_STB_TRUETYPE_IMPL_H
#define EXO_STB_TRUETYPE_IMPL_H

#define STB_TRUETYPE_IMPLEMENTATION
#include "stb_truetype.h"

#endif
