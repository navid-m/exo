#version 450

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

layout(set = 1, binding = 0, std140) uniform FloorVertexUniforms {
    mat4 uModel;
    mat4 uViewProj;
    mat4 uReflectViewProj;
};

layout(location = 0) out vec3 vWorldPos;
layout(location = 1) out vec3 vWorldNormal;
layout(location = 2) out vec4 vReflectClip;

void main() {
    vec4 world = uModel * vec4(aPosition, 1.0);
    vWorldPos = world.xyz;
    vWorldNormal = normalize((uModel * vec4(aNormal, 0.0)).xyz);
    vReflectClip = uReflectViewProj * world;
    gl_Position = uViewProj * world;
}
