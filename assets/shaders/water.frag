#version 450

layout(location = 0) in vec3 vWorldPos;
layout(location = 1) in vec4 vReflectClip;
layout(location = 2) in vec2 vUV;
layout(location = 0) out vec4 FragColor;

// binding 0: reflection render target, binding 1: normal map
layout(set = 2, binding = 0) uniform sampler2D uReflectionTex;
layout(set = 2, binding = 1) uniform sampler2D uNormalMap;

layout(set = 3, binding = 0, std140) uniform WaterFragmentUniforms {
    vec4 uCameraPos;      // xyz=pos, w=time
    vec4 uWaterColor;     // xyz=tint, w=unused
    vec4 uLightDir;       // xyz=direction (normalised), w=intensity
};

void main() {
    float time = uCameraPos.w;

    // Sample normal map twice at different scales/speeds and blend
    vec2 uv1 = vUV + vec2(time * 0.04,  time * 0.02);
    vec2 uv2 = vUV * 1.7 + vec2(-time * 0.03, time * 0.05);
    vec3 n1 = texture(uNormalMap, uv1).rgb * 2.0 - 1.0;
    vec3 n2 = texture(uNormalMap, uv2).rgb * 2.0 - 1.0;
    // Normal map is tangent-space XY ripple, Z up — remap to world Y-up surface
    vec3 tn = normalize(n1 + n2);
    vec3 normal_value = normalize(vec3(tn.x * 0.25, 1.0, tn.y * 0.25));

    vec3 view_dir = normalize(uCameraPos.xyz - vWorldPos);

    // Distort reflection UV by normal map
    vec2 distort = tn.xy * 0.04;
    vec3 reflection = vec3(0.05, 0.12, 0.22); // fallback sky
    if (vReflectClip.w > 0.0001) {
        vec2 uv = (vReflectClip.xy / vReflectClip.w) * 0.5 + 0.5;
        uv.y = 1.0 - uv.y;
        uv += distort;
        uv = clamp(uv, 0.001, 0.999);
        reflection = texture(uReflectionTex, uv).rgb;
    }

    // Fresnel: more reflective at grazing angles
    float fresnel = pow(1.0 - max(dot(view_dir, normal_value), 0.0), 4.0);
    fresnel = 0.08 + fresnel * 0.82;

    // Water base color
    vec3 water_tint = uWaterColor.xyz;

    // Specular highlight
    vec3 light_dir = normalize(uLightDir.xyz);
    vec3 half_vec  = normalize(view_dir + light_dir);
    float spec     = pow(max(dot(normal_value, half_vec), 0.0), 96.0) * uLightDir.w;
    vec3 specular  = vec3(1.0, 0.97, 0.92) * spec * 0.7;

    vec3 color_value = mix(water_tint, reflection, fresnel) + specular;
    float alpha = 0.72 + fresnel * 0.22;

    FragColor = vec4(color_value, alpha);
}
