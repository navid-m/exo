#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uSceneTex;

layout(set = 3, binding = 0, std140) uniform FxaaUniforms {
    vec4 uTexelSize;
};

vec3 sample_hdr(vec2 uv) {
    return texture(uSceneTex, uv).rgb;
}

vec3 aces_tonemap(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

vec3 bloom_sample(vec2 uv, vec2 texel) {
    vec3 bloom = vec3(0.0);
    bloom += max(sample_hdr(uv + vec2(-2.0 * texel.x, 0.0)) - vec3(1.0), vec3(0.0)) * 0.06136;
    bloom += max(sample_hdr(uv + vec2(-1.0 * texel.x, 0.0)) - vec3(1.0), vec3(0.0)) * 0.24477;
    bloom += max(sample_hdr(uv) - vec3(1.0), vec3(0.0)) * 0.38774;
    bloom += max(sample_hdr(uv + vec2(1.0 * texel.x, 0.0)) - vec3(1.0), vec3(0.0)) * 0.24477;
    bloom += max(sample_hdr(uv + vec2(2.0 * texel.x, 0.0)) - vec3(1.0), vec3(0.0)) * 0.06136;
    bloom += max(sample_hdr(uv + vec2(0.0, -2.0 * texel.y)) - vec3(1.0), vec3(0.0)) * 0.06136;
    bloom += max(sample_hdr(uv + vec2(0.0, -1.0 * texel.y)) - vec3(1.0), vec3(0.0)) * 0.24477;
    bloom += max(sample_hdr(uv + vec2(0.0, 1.0 * texel.y)) - vec3(1.0), vec3(0.0)) * 0.24477;
    bloom += max(sample_hdr(uv + vec2(0.0, 2.0 * texel.y)) - vec3(1.0), vec3(0.0)) * 0.06136;
    return bloom * 0.5;
}

void main() {
    vec2 texel = uTexelSize.xy;
    float exposure = uTexelSize.z;
    float bloom_intensity = uTexelSize.w;

    vec3 hdr_color = sample_hdr(vTexCoord);
    vec3 bloom = bloom_sample(vTexCoord, texel) * bloom_intensity;
    vec3 mapped = aces_tonemap((hdr_color + bloom) * exposure);
    vec3 gamma_corrected = pow(mapped, vec3(1.0 / 2.2));

    FragColor = vec4(gamma_corrected, 1.0);
}
