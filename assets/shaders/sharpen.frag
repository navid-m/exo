#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uSceneTex;

layout(set = 3, binding = 0, std140) uniform SharpenUniforms {
    vec4 uParams; // x = strength, y = 1/width, z = 1/height
};

void main() {
    vec2 texel = uParams.yz;
    vec3 center = texture(uSceneTex, vTexCoord).rgb;
    vec3 blur = texture(uSceneTex, vTexCoord + vec2(-texel.x, 0.0)).rgb
        + texture(uSceneTex, vTexCoord + vec2(texel.x, 0.0)).rgb
        + texture(uSceneTex, vTexCoord + vec2(0.0, -texel.y)).rgb
        + texture(uSceneTex, vTexCoord + vec2(0.0, texel.y)).rgb;
    blur *= 0.25;
    vec3 color_value = center + (center - blur) * uParams.x;
    FragColor = vec4(max(color_value, vec3(0.0)), 1.0);
}
