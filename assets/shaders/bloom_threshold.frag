#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uSceneTex;

layout(set = 3, binding = 0, std140) uniform BloomThresholdUniforms {
    vec4 uParams; // x = threshold, y = knee
};

void main() {
    vec3 color_value = texture(uSceneTex, vTexCoord).rgb;
    float brightness = max(color_value.r, max(color_value.g, color_value.b));
    float threshold = max(uParams.x, 0.0);
    float knee = max(uParams.y, 0.0001);
    float soft = clamp(brightness - threshold + knee, 0.0, 2.0 * knee);
    soft = (soft * soft) / (4.0 * knee);
    float contribution = max(soft, brightness - threshold) / max(brightness, 0.0001);
    FragColor = vec4(color_value * max(contribution, 0.0), 1.0);
}
