#version 450

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

layout(set = 1, binding = 0, std140) uniform GlowVertexUniforms {
    mat4 uViewProj;
    vec4 uBillboardPos;
    vec4 uBillboardSize;
    vec4 uCameraRight;
    vec4 uCameraUp;
};

layout(location = 0) out vec3 vLocalPos;

void main() {
    vLocalPos = aPosition;
    vec3 world_pos = uBillboardPos.xyz
        + uCameraRight.xyz * (aPosition.x * uBillboardSize.x)
        + uCameraUp.xyz * (aPosition.y * uBillboardSize.y);
    gl_Position = uViewProj * vec4(world_pos, 1.0);
}
