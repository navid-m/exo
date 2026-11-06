#version 450

layout(location = 0) in vec3 vLocalPos;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uDepthTex;

layout(set = 3, binding = 0, std140) uniform GlowFragmentUniforms {
    vec4 uGlowColorIntensity;
    vec4 uAlphaPad;
    vec4 uSoftParams; // x = 1/width, y = 1/height, z = softness, w = enabled
};

void main() {
    float radius = length(vLocalPos.xy) * 2.0;
    float fade = pow(max(1.0 - radius, 0.0), 2.0);
    float alpha = uAlphaPad.x * fade;
    if (uSoftParams.w > 0.5) {
        float scene_depth = texture(uDepthTex, gl_FragCoord.xy * uSoftParams.xy).r;
        float soft = clamp((scene_depth - gl_FragCoord.z) / max(uSoftParams.z, 0.0001), 0.0, 1.0);
        alpha *= soft;
    }
    FragColor = vec4(uGlowColorIntensity.xyz * uGlowColorIntensity.w, alpha);
}
