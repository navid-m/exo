#version 450

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

layout(location = 3) in vec4 aModel0;
layout(location = 4) in vec4 aModel1;
layout(location = 5) in vec4 aModel2;
layout(location = 6) in vec4 aModel3;
layout(location = 7) in vec4 aColorGlow;
layout(location = 8) in vec4 aReflectAlpha;

layout(set = 1, binding = 0, std140) uniform InstancedVertexUniforms {
    mat4 uViewProj;
    vec4 uUvTransform;
};

layout(location = 0) out vec3 vWorldPos;
layout(location = 1) out vec3 vWorldNormal;
layout(location = 2) out vec2 vTexCoord;
layout(location = 3) out vec4 vColorGlow;
layout(location = 4) out vec4 vReflectAlpha;

void main() {
    mat4 model = mat4(aModel0, aModel1, aModel2, aModel3);
    vec4 world = model * vec4(aPosition, 1.0);
    vWorldPos = world.xyz;
    vWorldNormal = normalize((model * vec4(aNormal, 0.0)).xyz);
    vTexCoord = aTexCoord * uUvTransform.xy + uUvTransform.zw;
    vColorGlow = aColorGlow;
    vReflectAlpha = aReflectAlpha;
    gl_Position = uViewProj * world;
}
