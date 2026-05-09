#version 450

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

layout(set = 1, binding = 0, std140) uniform WaterVertexUniforms {
    mat4 uModel;
    mat4 uViewProj;
    mat4 uReflectViewProj;
    vec4 uTimeWave; // x=time, y=wave_amplitude, z=wave_frequency, w=unused
};

layout(location = 0) out vec3 vWorldPos;
layout(location = 1) out vec4 vReflectClip;
layout(location = 2) out vec2 vUV;

void main() {
    // Vertex-level ripple: displace Y by a sine based on XZ position and time
    vec3 pos = aPosition;
    float wave = sin(pos.x * uTimeWave.z + uTimeWave.x * 2.0)
               * cos(pos.z * uTimeWave.z * 0.8 + uTimeWave.x * 1.7)
               * uTimeWave.y;
    pos.y += wave;

    vec4 world = uModel * vec4(pos, 1.0);
    vWorldPos    = world.xyz;
    vReflectClip = uReflectViewProj * world;
    // UV for normal map tiling: scale by world XZ
    vUV = world.xz * 0.4;
    gl_Position  = uViewProj * world;
}
