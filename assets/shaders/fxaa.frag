#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uSceneTex;

layout(set = 3, binding = 0, std140) uniform FxaaUniforms {
    vec4 uTexelSize;
};

float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
    vec2 texel = uTexelSize.xy;

    vec3 center = texture(uSceneTex, vTexCoord).rgb;

    float lC  = luma(center);
    float lN  = luma(texture(uSceneTex, vTexCoord + vec2(0.0,        texel.y)).rgb);
    float lS  = luma(texture(uSceneTex, vTexCoord + vec2(0.0,       -texel.y)).rgb);
    float lE  = luma(texture(uSceneTex, vTexCoord + vec2( texel.x,  0.0     )).rgb);
    float lW  = luma(texture(uSceneTex, vTexCoord + vec2(-texel.x,  0.0     )).rgb);

    float lMax   = max(lC, max(max(lN, lS), max(lE, lW)));
    float lMin   = min(lC, min(min(lN, lS), min(lE, lW)));
    float lRange = lMax - lMin;

    if (lRange < max(0.0312, lMax * 0.125)) {
        FragColor = vec4(center, 1.0);
        return;
    }

    float lNE = luma(texture(uSceneTex, vTexCoord + vec2( texel.x,  texel.y)).rgb);
    float lNW = luma(texture(uSceneTex, vTexCoord + vec2(-texel.x,  texel.y)).rgb);
    float lSE = luma(texture(uSceneTex, vTexCoord + vec2( texel.x, -texel.y)).rgb);
    float lSW = luma(texture(uSceneTex, vTexCoord + vec2(-texel.x, -texel.y)).rgb);

    float hEdge = abs(lNW + 2.0 * lN + lNE - lSW - 2.0 * lS - lSE);
    float vEdge = abs(lNW + 2.0 * lW + lSW - lNE - 2.0 * lE - lSE);
    bool horizontal = hEdge >= vEdge;

    float lPos      = horizontal ? lN : lE;
    float lNeg      = horizontal ? lS : lW;
    float gradient  = abs(lPos - lC);
    float blend     = smoothstep(0.0, 1.0, min(gradient / lRange * 0.75, 1.0));
    float stepDir   = sign(lPos - lC);
    vec2  blendDir  = horizontal ? vec2(0.0, stepDir * texel.y)
                                 : vec2(stepDir * texel.x, 0.0);

    FragColor = vec4(mix(center, texture(uSceneTex, vTexCoord + blendDir * blend).rgb, blend), 1.0);
}
