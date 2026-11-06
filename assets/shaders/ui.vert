#version 450

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

layout(set = 1, binding = 0, std140) uniform UiVertexUniforms {
    mat4 uModel;
    mat4 uViewProj;
    vec4 uUvTransform;
};

layout(location = 0) out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord * uUvTransform.xy + uUvTransform.zw;
    gl_Position = uViewProj * (uModel * vec4(aPosition, 1.0));
}
