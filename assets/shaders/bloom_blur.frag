#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uSourceTex;

layout(set = 3, binding = 0, std140) uniform BloomBlurUniforms {
    vec4 uTexelDirection; // xy = direction, z = radius
};

void main() {
    vec2 offset = uTexelDirection.xy * uTexelDirection.z;
    vec3 color_value = texture(uSourceTex, vTexCoord).rgb * 0.2270270270;
    color_value += texture(uSourceTex, vTexCoord + offset * 1.3846153846).rgb * 0.3162162162;
    color_value += texture(uSourceTex, vTexCoord - offset * 1.3846153846).rgb * 0.3162162162;
    color_value += texture(uSourceTex, vTexCoord + offset * 3.2307692308).rgb * 0.0702702703;
    color_value += texture(uSourceTex, vTexCoord - offset * 3.2307692308).rgb * 0.0702702703;
    FragColor = vec4(color_value, 1.0);
}
