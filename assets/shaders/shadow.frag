#version 450

// Depth-only pass: the shadow pipeline renders into a depth cube map and has
// no color attachments, so this fragment shader intentionally writes nothing.

void main() {
}
