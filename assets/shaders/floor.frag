#version 450

layout(location = 0) in vec3 vWorldPos;
layout(location = 1) in vec3 vWorldNormal;
layout(location = 2) in vec4 vReflectClip;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uReflectionTex;

layout(set = 3, binding = 0, std140) uniform FloorFragmentUniforms {
    vec4 uCameraPos;
};

vec3 sky_color(vec3 direction_value) {
    float t = clamp(direction_value.y * 0.5 + 0.5, 0.0, 1.0);
    return mix(vec3(0.05, 0.08, 0.14), vec3(0.26, 0.48, 0.84), t);
}

void main() {
    vec3 normal_value = normalize(vWorldNormal);
    vec3 view_dir = normalize(uCameraPos.xyz - vWorldPos);
    vec2 uv = vReflectClip.xy / max(vReflectClip.w, 0.0001);
    uv = uv * 0.5 + 0.5;
    vec3 reflection = sky_color(reflect(-view_dir, normal_value));
    if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
        reflection = texture(uReflectionTex, uv).rgb;
    }
    float fresnel = pow(1.0 - max(dot(view_dir, normal_value), 0.0), 5.0);
    vec3 tint = vec3(0.03, 0.06, 0.08);
    vec3 color_value = mix(tint, reflection, 0.42 + fresnel * 0.36);
    vec3 highlight = vec3(1.0, 0.98, 0.95)
        * pow(max(dot(reflect(-view_dir, normal_value), vec3(0.0, 1.0, 0.0)), 0.0), 18.0)
        * 0.04;
    FragColor = vec4(color_value + highlight, 0.58);
}
