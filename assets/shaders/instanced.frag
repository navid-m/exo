#version 450

layout(location = 0) in vec3 vWorldPos;
layout(location = 1) in vec3 vWorldNormal;
layout(location = 2) in vec2 vTexCoord;
layout(location = 3) in vec4 vColorGlow;
layout(location = 4) in vec4 vReflectAlpha;
layout(location = 0) out vec4 FragColor;

layout(set = 3, binding = 0, std140) uniform SceneFragmentUniforms {
    vec4 uColorReflective;
    vec4 uCameraGlow;
    vec4 uLightPosIntensity[8];
    vec4 uLightColorRadius[8];
    vec4 uAlphaPad;
    vec4 uSkyTop;
    vec4 uSkyHorizon;
    vec4 uAmbientPad;
    vec4 uLightMeta;
    vec4 uFogParams;
    vec4 uFogColor;
};

vec3 sky_color(vec3 direction_value) {
    float t = clamp(direction_value.y * 0.5 + 0.5, 0.0, 1.0);
    return mix(uSkyHorizon.rgb, uSkyTop.rgb, t);
}

void main() {
    vec3 normal_value = normalize(vWorldNormal);
    vec3 camera_pos = uCameraGlow.xyz;
    vec3 view_dir = normalize(camera_pos - vWorldPos);
    vec3 light_dir = normalize(vec3(-0.50, 0.82, 0.28));
    float diff = max(dot(normal_value, light_dir), 0.0);
    float hemi = normal_value.y * 0.5 + 0.5;
    vec3 half_vec = normalize(light_dir + view_dir);
    float spec = pow(max(dot(normal_value, half_vec), 0.0), 36.0);
    vec3 ambient = mix(vec3(0.07, 0.09, 0.13), sky_color(vec3(0.0, hemi * 2.0 - 1.0, 0.0)) * 0.28, hemi)
        * max(uAmbientPad.x, 0.0);

    float reflective = vReflectAlpha.x;
    float glow = vColorGlow.w;
    vec3 base_color = vColorGlow.rgb;
    vec3 base = base_color * (0.30 + diff * 0.68) + ambient * 0.35;
    vec3 highlight = vec3(1.0, 0.98, 0.94) * spec * (0.06 + reflective * 0.12);
    vec3 glow_value = base_color * glow * 0.10;
    vec3 point_contrib = vec3(0.0);
    int light_count = int(uLightMeta.x + 0.5);
    for (int i = 0; i < 8; i++) {
        if (i >= light_count) {
            break;
        }
        vec4 pos_intensity = uLightPosIntensity[i];
        vec4 color_radius = uLightColorRadius[i];
        vec3 to_light = pos_intensity.xyz - vWorldPos;
        float dist = length(to_light);
        float radius = max(color_radius.w, 0.001);
        float att = 1.0 / (1.0 + (dist * dist) / (radius * radius));
        vec3 pl_dir = normalize(to_light);
        float pdiff = max(dot(normal_value, pl_dir), 0.0);
        vec3 phalf = normalize(pl_dir + view_dir);
        float pspec = pow(max(dot(normal_value, phalf), 0.0), 48.0);
        float light_intensity = pos_intensity.w;
        point_contrib += color_radius.xyz * light_intensity * att
            * (base_color * pdiff * 0.55 + vec3(1.0, 0.98, 0.96) * pspec * (0.08 + reflective * 0.14));
    }

    vec3 final_color = base + highlight + glow_value + point_contrib;
    if (uFogParams.w > 0.5) {
        float fog_dist = length(camera_pos - vWorldPos);
        float height_factor = exp(-max(vWorldPos.y - uFogParams.y, 0.0) * max(uFogParams.z, 0.0001));
        float fog_amount = 1.0 - exp(-fog_dist * max(uFogParams.x, 0.0) * height_factor);
        final_color = mix(final_color, uFogColor.rgb, clamp(fog_amount, 0.0, 1.0));
    }
    FragColor = vec4(final_color, vReflectAlpha.y);
}
