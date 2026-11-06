#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 3, binding = 0, std140) uniform SkyUniforms {
    vec4 uForward;     // xyz = camera forward, w = tan(fov/2)
    vec4 uRight;       // xyz = camera right, w = aspect
    vec4 uUp;          // xyz = camera up
    vec4 uSkyTop;
    vec4 uSkyHorizon;
    vec4 uSunDir;      // xyz = direction to sun, w = angular radius
    vec4 uSunColor;    // rgb = sun tint, w = intensity
};

void main() {
    vec2 ndc = vec2(vTexCoord.x * 2.0 - 1.0, 1.0 - vTexCoord.y * 2.0);
    vec3 direction_value = normalize(
        uForward.xyz
        + uRight.xyz * ndc.x * uForward.w * uRight.w
        + uUp.xyz * ndc.y * uForward.w
    );

    float t = clamp(direction_value.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 color_value = mix(uSkyHorizon.rgb, uSkyTop.rgb, t);

    vec3 sun_dir = normalize(uSunDir.xyz);
    float cos_angle = dot(direction_value, sun_dir);
    float outer = cos(max(uSunDir.w, 0.0001));
    float inner = cos(max(uSunDir.w * 0.65, 0.0001));
    float disk = smoothstep(outer, inner, cos_angle);
    float glow = pow(max(cos_angle, 0.0), 180.0) * 0.35;
    color_value += uSunColor.rgb * (disk * uSunColor.w + glow);

    FragColor = vec4(color_value, 1.0);
}
