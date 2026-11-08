#version 450

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;

layout(set = 2, binding = 0) uniform sampler2D uSceneTex;
layout(set = 2, binding = 1) uniform sampler2D uDepthTex;

layout(set = 3, binding = 0, std140) uniform MotionBlurUniforms {
    mat4 uPrevViewProj;
    vec4 uCameraRight;   // xyz = right, w = tan(fov / 2)
    vec4 uCameraUp;      // xyz = up, w = aspect ratio
    vec4 uCameraForward; // xyz = forward, w = far plane
    vec4 uCameraPos;     // xyz = position, w = near plane
    vec4 uParams;        // x = amount, y = samples, z = max radius, w = depth threshold
    vec4 uExtra;         // x = velocity scale
};

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float linear_depth(float depth_value) {
    float near_plane = uCameraPos.w;
    float far_plane = uCameraForward.w;
    return (near_plane * far_plane)
        / max(far_plane - depth_value * (far_plane - near_plane), 0.0001);
}

// Reconstruct the world-space position of the current pixel from its depth.
vec3 world_position(vec2 uv, float distance_value) {
    vec2 ndc = vec2(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
    float tan_half = uCameraRight.w;
    return uCameraPos.xyz
        + uCameraRight.xyz * (ndc.x * tan_half * uCameraUp.w) * distance_value
        + uCameraUp.xyz * (ndc.y * tan_half) * distance_value
        + uCameraForward.xyz * distance_value;
}

void main() {
    vec2 uv = vTexCoord;
    vec3 center = texture(uSceneTex, uv).rgb;
    float center_raw = texture(uDepthTex, uv).r;
    float center_depth = linear_depth(center_raw);

    if (uParams.x <= 0.0) {
        FragColor = vec4(center, 1.0);
        return;
    }

    // Reproject this pixel's world position through the previous frame's
    // camera. The delta is the camera's screen-space velocity for this depth.
    vec3 world = world_position(uv, center_depth);
    vec4 previous_clip = uPrevViewProj * vec4(world, 1.0);
    if (previous_clip.w <= 0.0001) {
        FragColor = vec4(center, 1.0);
        return;
    }

    vec2 previous_uv = previous_clip.xy / previous_clip.w * 0.5 + 0.5;
    previous_uv.y = 1.0 - previous_uv.y;
    vec2 velocity = (uv - previous_uv) * uExtra.x;
    float speed = length(velocity);

    if (speed < 0.00005) {
        FragColor = vec4(center, 1.0);
        return;
    }

    float max_radius = max(uParams.z, 0.0001);
    if (speed > max_radius) {
        velocity *= max_radius / speed;
    }

    // Jitter the gather pattern per pixel so the low sample count reads as a
    // smooth trail instead of a set of discrete ghosts.
    int samples = clamp(int(uParams.y), 1, 32);
    float jitter = hash12(gl_FragCoord.xy) - 0.5;
    float center_weight = 1.15;
    vec3 accum = center * center_weight;
    float weight_sum = center_weight;
    float depth_threshold = max(uParams.w, 0.0001);

    for (int i = 0; i < 32; i++) {
        if (i >= samples) {
            break;
        }

        float t = (float(i) + 0.5 + jitter) / float(samples) - 0.5;
        vec2 sample_uv = clamp(uv + velocity * t, vec2(0.0), vec2(1.0));
        vec3 sample_color = texture(uSceneTex, sample_uv).rgb;
        float sample_depth = linear_depth(texture(uDepthTex, sample_uv).r);

        // Reject samples across depth discontinuities. This is what keeps
        // fence posts, pillars and character silhouettes crisp while the
        // background streams past them.
        float relative_depth = abs(sample_depth - center_depth)
            / max(max(sample_depth, center_depth), 0.001);
        float depth_weight = 1.0 - smoothstep(depth_threshold * 0.35, depth_threshold, relative_depth);

        // Triangular reconstruction filter: samples near the pixel's true
        // position contribute more than the tips of the trail.
        float filter_weight = 1.0 - abs(t) * 0.85;
        float weight = depth_weight * filter_weight;
        accum += sample_color * weight;
        weight_sum += weight;
    }

    vec3 blurred = accum / max(weight_sum, 0.0001);
    float blend = clamp(uParams.x, 0.0, 1.0) * smoothstep(0.0, 0.001, speed);
    FragColor = vec4(mix(center, blurred, blend), 1.0);
}
