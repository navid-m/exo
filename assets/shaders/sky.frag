#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 3, binding = 0, std140) uniform SkyUniforms {
    vec4 uForward;    // xyz = camera forward, w = tan(fovY * 0.5)
    vec4 uRight;      // xyz = camera right,   w = aspect ratio
    vec4 uUp;         // xyz = camera up,      w = time
    vec4 uSunDir;     // xyz = sun direction,  w = intensity
    vec4 uSunColor;   // rgb = sun tint,       w = angular size
    vec4 uZenith;     // rgb = zenith color,   w = cloud cover
    vec4 uHorizon;    // rgb = horizon color,  w = cloud speed
    vec4 uGround;     // rgb = below-horizon color
};

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float value_noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    for (int i = 0; i < 5; i++) {
        value += amplitude * value_noise(p);
        p = p * 2.03 + vec2(17.1, 9.2);
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = vTexCoord;
    vec2 ndc = vec2(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);

    vec3 dir = normalize(
        uForward.xyz
        + uRight.xyz * (ndc.x * uForward.w * uRight.w)
        + uUp.xyz * (ndc.y * uForward.w)
    );

    float height = clamp(dir.y, -1.0, 1.0);
    float up = max(height, 0.0);

    // Sky gradient: warm haze at the horizon rising into a deeper zenith.
    float horizon_mix = pow(1.0 - up, 3.2);
    vec3 color_value = mix(uZenith.rgb, uHorizon.rgb, horizon_mix);

    // A subtle warm bloom along the horizon makes the city feel sunlit.
    float sun_dot = max(dot(dir, normalize(uSunDir.xyz)), 0.0);
    color_value += uSunColor.rgb * pow(sun_dot, 5.0) * 0.10 * uSunDir.w;

    // Sun disc and tight halo.
    float cos_size = cos(max(uSunColor.w, 0.0001));
    float disc = smoothstep(cos_size, cos(uSunColor.w * 0.55), sun_dot);
    color_value += uSunColor.rgb * disc * (1.4 + uSunDir.w * 1.2);
    color_value += uSunColor.rgb * pow(sun_dot, 220.0) * 0.7 * uSunDir.w;

    // Ground haze below the horizon.
    color_value = mix(uGround.rgb, color_value, smoothstep(-0.10, 0.03, height));

    // Soft procedural cloud deck, projected onto a virtual plane. Kept out of
    // the way of the horizon so it never forms a hard seam.
    if (uZenith.w > 0.001 && height > 0.005) {
        vec2 cloud_uv = dir.xz / max(dir.y + 0.16, 0.06);
        cloud_uv = cloud_uv * vec2(0.72, 0.52) + vec2(uHorizon.w * 9.0, uHorizon.w * 3.5);
        float cloud = fbm(cloud_uv * 1.65);
        cloud = smoothstep(0.54, 0.83, cloud);
        cloud *= smoothstep(0.005, 0.16, height);
        cloud *= uZenith.w;
        vec3 cloud_color = mix(uHorizon.rgb, vec3(1.02, 1.0, 0.97), 0.55);
        cloud_color += uSunColor.rgb * pow(sun_dot, 8.0) * 0.25;
        color_value = mix(color_value, cloud_color, clamp(cloud * 0.62, 0.0, 0.68));
    }

    FragColor = vec4(color_value, 1.0);
}
