#version 450

layout(location = 0) in vec3 vWorldPos;
layout(location = 1) in vec3 vWorldNormal;
layout(location = 2) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;
layout(set = 2, binding = 0) uniform sampler2D uAlbedo;
layout(set = 2, binding = 1) uniform samplerCube uShadowMap;
layout(set = 2, binding = 2) uniform sampler2D uSunShadowMap;

layout(set = 3, binding = 0, std140) uniform SceneFragmentUniforms {
    vec4 uColorReflective;
    vec4 uCameraGlow;
    vec4 uLightPosIntensity[8];
    vec4 uLightColorRadius[8];
    vec4 uAlphaPad;
    vec4 uSkyTop;
    vec4 uSkyHorizon;
    vec4 uAmbientPad;
    vec4 uLightMeta;
    vec4 uSunDirIntensity;
    vec4 uSunColor;
    vec4 uFogParams;
    mat4 uSunViewProj;
    vec4 uSunShadowParams;
};

vec3 sky_color(vec3 direction_value) {
    float t = clamp(direction_value.y * 0.5 + 0.5, 0.0, 1.0);
    return mix(uSkyHorizon.rgb, uSkyTop.rgb, t);
}

// glTF albedo textures are authored in sRGB. Convert to linear before any
// lighting so the scene keeps its contrast and the final gamma encode is the
// only transfer function applied to the image.
vec3 srgb_to_linear(vec3 color_value) {
    return pow(max(color_value, vec3(0.0)), vec3(2.2));
}

float shadow_visibility(
    vec3 sample_dir,
    float distance_to_light,
    float near_plane,
    float far_plane,
    float bias
) {
    float sampled_depth = texture(uShadowMap, sample_dir).r;
    float closest_depth = (near_plane * far_plane)
        / max(far_plane - sampled_depth * (far_plane - near_plane), 0.0001);
    return (distance_to_light - bias > closest_depth) ? 0.0 : 1.0;
}

// Small PCF kernel in cube-face tangent space. Softens the hard voxel edges of
// the point-light shadow map while keeping the bias stable.
float sample_shadow(vec3 world_pos, vec3 normal_value, vec3 light_pos, vec3 light_dir, float near_plane, float far_plane) {
    vec3 to_light = world_pos - light_pos;
    float distance_to_light = length(to_light);
    if (distance_to_light < 0.0001) {
        return 1.0;
    }
    vec3 dir = normalize(to_light);
    vec3 up_hint = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up_hint, dir));
    vec3 bitangent = cross(dir, tangent);

    float ndl = max(dot(normal_value, light_dir), 0.0);
    float bias = max(0.10 * (1.0 - ndl), 0.012);
    float softness = 0.0045;

    float visibility = shadow_visibility(dir, distance_to_light, near_plane, far_plane, bias);
    visibility += shadow_visibility(normalize(dir + tangent * softness), distance_to_light, near_plane, far_plane, bias);
    visibility += shadow_visibility(normalize(dir - tangent * softness), distance_to_light, near_plane, far_plane, bias);
    visibility += shadow_visibility(normalize(dir + bitangent * softness), distance_to_light, near_plane, far_plane, bias);
    visibility += shadow_visibility(normalize(dir - bitangent * softness), distance_to_light, near_plane, far_plane, bias);
    return visibility * 0.2;
}

float sample_sun_shadow(vec3 world_pos, vec3 normal_value, vec3 sun_dir) {
    vec4 clip = uSunViewProj * vec4(world_pos, 1.0);
    if (clip.w <= 0.0001) {
        return 1.0;
    }
    vec3 ndc = clip.xyz / clip.w;
    vec2 uv = ndc.xy * 0.5 + 0.5;
    uv.y = 1.0 - uv.y;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 || ndc.z > 1.0) {
        return 1.0;
    }
    float ndl = max(dot(normal_value, sun_dir), 0.0);
    float bias = max(uSunShadowParams.y * (1.6 - ndl), uSunShadowParams.y * 0.35);
    float texel = uSunShadowParams.z;
    float visibility = 0.0;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y)) * texel;
            float sampled = texture(uSunShadowMap, uv + offset).r;
            visibility += (ndc.z - bias > sampled) ? 0.0 : 1.0;
        }
    }
    return visibility / 9.0;
}

void main() {
    if (uAlphaPad.z > 0.5) {
        vec4 ui_tex = texture(uAlbedo, vTexCoord);
        vec3 ui_color = mix(uColorReflective.xyz, uColorReflective.xyz * ui_tex.rgb, uAlphaPad.y);
        FragColor = vec4(ui_color, ui_tex.a * uAlphaPad.x);
        return;
    }

    vec3 normal_value = normalize(vWorldNormal);
    vec3 camera_pos = uCameraGlow.xyz;
    vec3 view_dir = normalize(camera_pos - vWorldPos);
    float reflective = uColorReflective.w;
    float glow = uCameraGlow.w;
    float has_texture = uAlphaPad.y;

    vec3 texel = texture(uAlbedo, vTexCoord).rgb;
    vec3 albedo = srgb_to_linear(texel);
    vec3 base_color = mix(uColorReflective.xyz, albedo, has_texture);

    vec3 sun_dir = normalize(uSunDirIntensity.xyz);
    float sun_intensity = max(uSunDirIntensity.w, 0.0);
    vec3 sun_color = uSunColor.rgb;

    float diff = max(dot(normal_value, sun_dir), 0.0);
    float hemi = normal_value.y * 0.5 + 0.5;
    vec3 half_vec = normalize(sun_dir + view_dir);
    float spec = pow(max(dot(normal_value, half_vec), 0.0), 42.0);
    float sun_shadow = 1.0;
    if (uSunShadowParams.x > 0.5) {
        sun_shadow = sample_sun_shadow(vWorldPos, normal_value, sun_dir);
        sun_shadow = mix(1.0 - clamp(uSunShadowParams.w, 0.0, 1.0), 1.0, sun_shadow);
    }

    vec3 sky_ambient = sky_color(vec3(0.0, hemi * 2.0 - 1.0, 0.0));
    vec3 ambient = mix(vec3(0.085, 0.105, 0.150), sky_ambient * 0.66, hemi)
        * max(uAmbientPad.x, 0.0);
    vec3 fill = vec3(0.180, 0.190, 0.215);

    // Soft sky bounce + a grazing-angle reflection keeps large flat facades
    // from reading as solid matte cards.
    float fresnel = pow(1.0 - max(dot(normal_value, view_dir), 0.0), 4.0);
    vec3 sky_reflect = sky_color(reflect(-view_dir, normal_value))
        * (0.035 + fresnel * 0.16) * (0.35 + reflective * 1.4);

    vec3 base = base_color * (fill + ambient + sun_color * sun_intensity * diff * 0.78 * sun_shadow);
    vec3 highlight = sun_color * spec * sun_intensity * (0.10 + reflective * 0.28) * mix(0.20, 1.0, sun_shadow);
    vec3 glow_value = base_color * glow * 0.10;

    vec3 point_contrib = vec3(0.0);
    int light_count = int(uLightMeta.x + 0.5);
    int shadow_light = int(uLightMeta.y + 0.5);
    float shadow_intensity = clamp(uAmbientPad.y, 0.0, 1.0);
    float light_intensity_scale = max(uAmbientPad.z, 0.0);
    for (int i = 0; i < 8; i++) {
        if (i >= light_count) {
            break;
        }
        vec4 pos_intensity = uLightPosIntensity[i];
        vec4 color_radius = uLightColorRadius[i];
        vec3 to_light = pos_intensity.xyz - vWorldPos;
        float dist = length(to_light);
        float radius = max(color_radius.w, 0.001);
        float att = 1.0 / (1.0 + (dist * dist) / (radius * radius));
        // A soft cutoff avoids visible hard light bubbles at the radius.
        att *= 1.0 - smoothstep(radius * 0.55, radius, dist) * 0.85;
        vec3 pl_dir = normalize(to_light);
        float pdiff = max(dot(normal_value, pl_dir), 0.0);
        vec3 phalf = normalize(pl_dir + view_dir);
        float pspec = pow(max(dot(normal_value, phalf), 0.0), 48.0);
        float light_intensity = pos_intensity.w * light_intensity_scale;
        float shadow_mult = 1.0;
        if (i == shadow_light && uLightMeta.w > 0.0) {
            float shadow = sample_shadow(
                vWorldPos,
                normal_value,
                pos_intensity.xyz,
                pl_dir,
                uLightMeta.z,
                uLightMeta.w
            );
            shadow_mult = mix(1.0, shadow, shadow_intensity);
        }
        point_contrib += color_radius.xyz * light_intensity * att * shadow_mult
            * (base_color * pdiff * 0.58 + vec3(1.0, 0.98, 0.96) * pspec * (0.10 + reflective * 0.16));
    }

    vec3 color_value = base + highlight + glow_value + sky_reflect + point_contrib;

    if (uFogParams.z > 0.5) {
        float cam_dist = length(camera_pos - vWorldPos);
        float height_atten = exp(-max(vWorldPos.y, 0.0) * uFogParams.y);
        float fog = 1.0 - exp(-cam_dist * uFogParams.x * height_atten);
        vec3 fog_dir = normalize(vWorldPos - camera_pos);
        vec3 fog_color = sky_color(fog_dir);
        color_value = mix(color_value, fog_color, clamp(fog * uFogParams.w, 0.0, 0.88));
    }

    FragColor = vec4(color_value, uAlphaPad.x);
}
