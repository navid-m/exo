#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;
layout(set = 2, binding = 0) uniform sampler2D uSource;

void main() {
    FragColor = texture(uSource, vTexCoord);
}
