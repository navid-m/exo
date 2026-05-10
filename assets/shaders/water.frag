#version 450

layout(location = 0) in vec3 vWorldPos;
layout(location = 1) in vec4 vReflectClip;
layout(location = 2) in vec2 vUV;
layout(location = 0) out vec4 FragColor;
layout(set = 2, binding = 0) uniform sampler2D uReflectionTex;
layout(set = 2, binding = 1) uniform sampler2D uNormalMap;

layout(set = 3, binding = 0, std140) uniform WaterFragmentUniforms {
    vec4 uCameraPos;     
    vec4 uWaterColor;    
    vec4 uLightDir;
    vec4 uWaterParams;
};

float sdRoundedRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
}

void main() {
    float time = uCameraPos.w;

    float sx = uWaterParams.y;
    float sz = uWaterParams.z;
    vec2 planePos = vWorldPos.xz;
    vec2 halfExt  = vec2(sx, sz) * 0.5;
    float cornerR = uWaterParams.x * min(halfExt.x, halfExt.y);
    float dist    = sdRoundedRect(planePos, halfExt, cornerR);
    float edgeMask = 1.0 - smoothstep(-0.08, 0.0, dist);
    if (edgeMask <= 0.001) discard;

    vec2 uv1 = vUV + vec2(time * 0.04,  time * 0.02);
    vec2 uv2 = vUV * 1.7 + vec2(-time * 0.03, time * 0.05);
    vec3 n1 = texture(uNormalMap, uv1).rgb * 2.0 - 1.0;
    vec3 n2 = texture(uNormalMap, uv2).rgb * 2.0 - 1.0;
    vec3 tn = normalize(n1 + n2);
    vec3 normal_value = normalize(vec3(tn.x * 0.25, 1.0, tn.y * 0.25));

    vec3 view_dir = normalize(uCameraPos.xyz - vWorldPos);

    vec2 distort = tn.xy * 0.04;
    vec3 reflection = vec3(0.05, 0.12, 0.22);
    if (vReflectClip.w > 0.0001) {
        vec2 uv = (vReflectClip.xy / vReflectClip.w) * 0.5 + 0.5;
        uv.y = 1.0 - uv.y;
        uv += distort;
        uv = clamp(uv, 0.001, 0.999);
        reflection = texture(uReflectionTex, uv).rgb;
    }

    float fresnel = pow(1.0 - max(dot(view_dir, normal_value), 0.0), 4.0);
    fresnel = 0.08 + fresnel * 0.82;

    vec3 water_tint = uWaterColor.xyz;
    vec3 light_dir = normalize(uLightDir.xyz);
    vec3 half_vec  = normalize(view_dir + light_dir);
    float spec     = pow(max(dot(normal_value, half_vec), 0.0), 96.0) * uLightDir.w;
    vec3 specular  = vec3(1.0, 0.97, 0.92) * spec * 0.7;

    vec3 color_value = mix(water_tint, reflection, fresnel) + specular;
    float alpha = (0.72 + fresnel * 0.22) * edgeMask;

    vec2 cellUV   = planePos * 1.8;
    vec2 cellID   = floor(cellUV);
    vec2 cellFrac = fract(cellUV);

    float sparkle = 0.0;
    for (int dy = -1; dy <= 1; dy++) {
        for (int dx = -1; dx <= 1; dx++) {
            vec2 nID = cellID + vec2(float(dx), float(dy));
            float h1 = hash(nID);
            float h2 = hash(nID + 17.3);
            float h3 = hash(nID + 31.7);
            float drift = h3 * 6.28318;
            vec2 center = vec2(h1, h2) + 0.18 * vec2(cos(time * 0.6 + drift), sin(time * 0.8 + drift));
            vec2 diff   = cellFrac - center + vec2(float(dx), float(dy));
            float d     = length(diff);
            float flicker = 0.5 + 0.5 * sin(time * (2.5 + h1 * 4.0) + h2 * 6.28318);
            float radius  = 0.04 + 0.03 * flicker;
            float blob    = smoothstep(radius, 0.0, d) * flicker;
            sparkle += blob;
        }
    }
    sparkle = clamp(sparkle, 0.0, 1.0);

    float edgeFade = smoothstep(0.0, 0.4, -dist / max(cornerR, 0.01));
    sparkle *= edgeFade;

    vec3 sparkleColor = vec3(0.85, 0.95, 1.0) * sparkle * 0.9;
    color_value += sparkleColor;

    FragColor = vec4(color_value, alpha);
}
