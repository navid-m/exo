#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uAlbedo;

layout(set = 3, binding = 0, std140) uniform UiFragmentUniforms {
    vec4 uColor;
    vec4 uParams; // x = use texture, y = alpha
};

void main() {
    vec4 tex = texture(uAlbedo, vTexCoord);
    vec3 color_value = mix(uColor.rgb, tex.rgb, uParams.x);
    float alpha = uParams.y * mix(1.0, tex.a, uParams.x);
    FragColor = vec4(color_value, alpha);
}
