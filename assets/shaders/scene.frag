#version 450

layout(location = 0) in vec3 vWorldPos;
layout(location = 1) in vec3 vWorldNormal;
layout(location = 0) out vec4 FragColor;

layout(set = 3, binding = 0, std140) uniform SceneFragmentUniforms {
    vec4 uColorReflective;
    vec4 uCameraGlow;
    vec4 uLightPosIntensity;
    vec4 uLightColorRadius;
    vec4 uAlphaPad;
};

vec3 sky_color(vec3 direction_value) {
    float t = clamp(direction_value.y * 0.5 + 0.5, 0.0, 1.0);
    return mix(vec3(0.05, 0.08, 0.14), vec3(0.26, 0.48, 0.84), t);
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
    vec3 ambient = mix(vec3(0.07, 0.09, 0.13), sky_color(vec3(0.0, hemi * 2.0 - 1.0, 0.0)) * 0.28, hemi);
    vec3 base_color = uColorReflective.xyz;
    float reflective = uColorReflective.w;
    float glow = uCameraGlow.w;
    vec3 base = base_color * (0.30 + diff * 0.68) + ambient * 0.35;
    vec3 highlight = vec3(1.0, 0.98, 0.94) * spec * (0.06 + reflective * 0.12);
    vec3 glow_value = base_color * glow * 0.10;
    vec3 to_light = uLightPosIntensity.xyz - vWorldPos;
    float dist = length(to_light);
    float radius = max(uLightColorRadius.w, 0.001);
    float att = 1.0 / (1.0 + (dist * dist) / (radius * radius));
    vec3 pl_dir = normalize(to_light);
    float pdiff = max(dot(normal_value, pl_dir), 0.0);
    vec3 phalf = normalize(pl_dir + view_dir);
    float pspec = pow(max(dot(normal_value, phalf), 0.0), 48.0);
    vec3 point_color = uLightColorRadius.xyz;
    float light_intensity = uLightPosIntensity.w;
    vec3 point_contrib = point_color * light_intensity * att
        * (base_color * pdiff * 0.55 + vec3(1.0, 0.98, 0.96) * pspec * (0.08 + reflective * 0.14));
    FragColor = vec4(base + highlight + glow_value + point_contrib, uAlphaPad.x);
}
