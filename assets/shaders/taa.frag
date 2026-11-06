#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uSceneTex;
layout(set = 2, binding = 1) uniform sampler2D uHistoryTex;

layout(set = 3, binding = 0, std140) uniform TaaUniforms {
    vec4 uParams; // x = history blend, y = history valid, z = 1/width, w = 1/height
};

void main() {
    vec3 current = texture(uSceneTex, vTexCoord).rgb;
    if (uParams.y < 0.5) {
        FragColor = vec4(current, 1.0);
        return;
    }

    vec2 texel = uParams.zw;
    vec3 neighborhood_min = current;
    vec3 neighborhood_max = current;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            if (x == 0 && y == 0) {
                continue;
            }
            vec3 sample_color = texture(uSceneTex, vTexCoord + vec2(float(x), float(y)) * texel).rgb;
            neighborhood_min = min(neighborhood_min, sample_color);
            neighborhood_max = max(neighborhood_max, sample_color);
        }
    }

    vec3 history = texture(uHistoryTex, vTexCoord).rgb;
    history = clamp(history, neighborhood_min, neighborhood_max);
    vec3 color_value = mix(current, history, clamp(uParams.x, 0.0, 0.999));
    FragColor = vec4(color_value, 1.0);
}
