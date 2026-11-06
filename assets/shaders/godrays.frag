#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uSceneTex;

layout(set = 3, binding = 0, std140) uniform GodrayUniforms {
    vec4 uLight;  // xy = light position in UV space, z = intensity, w = threshold
    vec4 uParams; // x = decay, y = density, z = weight, w = sample count
    vec4 uColor;  // rgb = shaft tint
};

float brightness_of(vec3 color_value) {
    return max(color_value.r, max(color_value.g, color_value.b));
}

void main() {
    vec2 uv = vTexCoord;
    float samples = clamp(uParams.w, 1.0, 64.0);
    vec2 delta = (uv - uLight.xy) * (uParams.y / samples);

    // Jitter the marching start to hide banding between the discrete samples.
    float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    vec2 coord = uv - delta * dither;

    float decay = 1.0;
    float total_weight = 0.0;
    vec3 accum = vec3(0.0);
    float threshold = max(uLight.w, 0.0);

    for (int i = 0; i < 64; i++) {
        if (float(i) >= samples) {
            break;
        }
        vec3 sample_color = texture(uSceneTex, clamp(coord, vec2(0.0), vec2(1.0))).rgb;
        // Only bright pixels feed the shafts; dark geometry occludes them.
        float mask = smoothstep(threshold, threshold + 0.20, brightness_of(sample_color));
        float weight = decay * max(uParams.z, 0.0);
        accum += sample_color * mask * weight;
        total_weight += weight;
        decay *= uParams.x;
        coord -= delta;
    }

    accum /= max(total_weight, 0.0001);
    FragColor = vec4(accum * uColor.rgb * uLight.z, 1.0);
}
