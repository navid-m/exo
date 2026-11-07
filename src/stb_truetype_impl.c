/*
 * Instantiates stb_truetype's implementation as a package-local translation
 * unit. The engine's font logic lives in src/engine/font.sx and calls the
 * public stbtt_* API directly.
 */
#define STB_TRUETYPE_IMPLEMENTATION
#include "stb_truetype.h"
