#version 450

layout(location = 0) in vec3 vLocalPos;
layout(location = 0) out vec4 FragColor;

layout(set = 3, binding = 0, std140) uniform GlowFragmentUniforms {
    vec4 uGlowColorIntensity;
    vec4 uAlphaPad;
};

void main() {
    float radius = length(vLocalPos.xy) * 2.0;
    float fade = pow(max(1.0 - radius, 0.0), 2.0);
    FragColor = vec4(uGlowColorIntensity.xyz * uGlowColorIntensity.w, uAlphaPad.x * fade);
}
