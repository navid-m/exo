#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uSceneTex;
layout(set = 2, binding = 1) uniform sampler2D uBloomTex;

layout(set = 3, binding = 0, std140) uniform CompositeUniforms {
    vec4 uBloom;         // x = intensity, y = enabled, z = unused, w = fxaa
    vec4 uVignette;      // x = intensity, y = smoothness, z = enabled
    vec4 uColor;         // x = exposure, y = contrast, z = saturation, w = chromatic aberration
    vec4 uScreen;        // x = 1/width, y = 1/height, z = time, w = grain
    vec4 uVignetteColor;
};

float luma(vec3 color_value) {
    return dot(color_value, vec3(0.299, 0.587, 0.114));
}

vec3 aces_tonemap(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

vec3 sample_scene(vec2 uv) {
    vec3 center = texture(uSceneTex, uv).rgb;
    if (uBloom.w < 0.5) {
        return center;
    }
    vec2 texel = uScreen.xy;
    vec3 nw = texture(uSceneTex, uv + vec2(-texel.x, -texel.y)).rgb;
    vec3 ne = texture(uSceneTex, uv + vec2( texel.x, -texel.y)).rgb;
    vec3 sw = texture(uSceneTex, uv + vec2(-texel.x,  texel.y)).rgb;
    vec3 se = texture(uSceneTex, uv + vec2( texel.x,  texel.y)).rgb;
    float luma_center = luma(center);
    float luma_min = min(luma_center, min(min(luma(nw), luma(ne)), min(luma(sw), luma(se))));
    float luma_max = max(luma_center, max(max(luma(nw), luma(ne)), max(luma(sw), luma(se))));
    float edge = luma_max - luma_min;
    if (edge > max(0.0312, luma_max * 0.125)) {
        vec3 blurred = (nw + ne + sw + se) * 0.25;
        return mix(center, blurred, 0.35);
    }
    return center;
}

void main() {
    vec2 uv = vTexCoord;
    vec2 from_center = uv - vec2(0.5);
    float aberration = uColor.w;
    vec3 scene_color;
    if (aberration > 0.0) {
        scene_color.r = sample_scene(uv - from_center * aberration).r;
        scene_color.g = sample_scene(uv).g;
        scene_color.b = sample_scene(uv + from_center * aberration).b;
    } else {
        scene_color = sample_scene(uv);
    }

    vec3 bloom = texture(uBloomTex, uv).rgb * uBloom.x * uBloom.y;
    vec3 color_value = (scene_color + bloom) * uColor.x;
    color_value = aces_tonemap(color_value);

    float luminance = luma(color_value);
    color_value = mix(vec3(luminance), color_value, uColor.z);
    color_value = (color_value - vec3(0.5)) * uColor.y + vec3(0.5);
    color_value = clamp(color_value, 0.0, 1.0);

    float dist = length(from_center * vec2(1.0, 1.25));
    float vignette = pow(smoothstep(0.25, 0.90, dist), max(uVignette.y, 0.001));
    if (uVignette.z > 0.5) {
        color_value = mix(color_value, uVignetteColor.rgb, vignette * uVignette.x);
    }

    if (uScreen.w > 0.0) {
        float grain = fract(sin(dot(uv * uScreen.z, vec2(12.9898, 78.233))) * 43758.5453);
        color_value += (grain - 0.5) * uScreen.w;
    }

    color_value = pow(max(color_value, vec3(0.0)), vec3(1.0 / 2.2));
    FragColor = vec4(color_value, 1.0);
}
