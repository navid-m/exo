#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uSceneTex;

layout(set = 3, binding = 0, std140) uniform FlareUniforms {
    vec4 uLight;  // xy = light UV, z = intensity, w = threshold
    vec4 uParams; // x = streak width, y = ghost strength, z = aspect, w = enabled
    vec4 uColor;
};

float luma(vec3 color_value) {
    return dot(color_value, vec3(0.299, 0.587, 0.114));
}

float bright_mask(vec3 color_value, float threshold) {
    return smoothstep(threshold, threshold + 0.20, max(color_value.r, max(color_value.g, color_value.b)));
}

void main() {
    vec2 uv = vTexCoord;
    vec2 light = uLight.xy;
    float threshold = max(uLight.w, 0.0);
    vec3 accum = vec3(0.0);

    // Anamorphic streak: sample a horizontal band through the light and
    // localize it vertically so it reads as a lens artifact.
    float vertical = exp(-abs(uv.y - light.y) * 150.0);
    if (vertical > 0.001) {
        for (int i = 0; i < 24; i++) {
            float t = (float(i) / 23.0) * 2.0 - 1.0;
            vec2 p = vec2(light.x + t * uParams.x, light.y);
            vec3 sample_color = texture(uSceneTex, clamp(p, vec2(0.0), vec2(1.0))).rgb;
            float mask = bright_mask(sample_color, threshold);
            float falloff = exp(-abs(t) * 4.0);
            accum += sample_color * mask * falloff;
        }
        accum /= 24.0;
        accum *= vertical * 2.4;
    }

    // Halo directly around the light.
    vec2 halo_delta = (uv - light) * vec2(uParams.z, 1.0);
    float halo = exp(-dot(halo_delta, halo_delta) * 220.0);
    accum += uColor.rgb * halo * 0.8;

    // A few mirrored ghosts along the light-to-center axis.
    vec2 axis = vec2(0.5) - light;
    for (int i = 0; i < 4; i++) {
        float k = 0.45 + float(i) * 0.42;
        vec2 ghost_pos = light + axis * k * 2.2;
        vec3 ghost_color = texture(uSceneTex, clamp(ghost_pos, vec2(0.0), vec2(1.0))).rgb;
        float ghost_mask = bright_mask(ghost_color, threshold);
        vec2 ghost_delta = (uv - ghost_pos) * vec2(uParams.z, 1.0);
        float blob = exp(-dot(ghost_delta, ghost_delta) * 900.0);
        accum += ghost_color * ghost_mask * blob * uParams.y * (1.0 - float(i) * 0.18);
    }

    FragColor = vec4(accum * uColor.rgb * uLight.z, 1.0);
}
