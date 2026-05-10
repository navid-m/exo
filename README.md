# Exo

A simple 3D game engine for designed for ease of use and performance.

Built on the <a href="https://github.com/spectrelang/spectre">Spectre</a> programming language.

Currently supports:

- Full ECS
- Builtin physics system
- Audio subsystem
- Input system
- GLB model rendering with textures
- Simple 3D graphical primitives
- Water effects
- Particle effects

Example usage:

```spectre
val ecs       = use("ecs.sx")
val engine    = use("engine.sx")
val rendering = use("rendering.sx")

fn build_scene() ecs.Scene3D = {
    val scene: mut ecs.Scene3D = ecs.new_scene(
        ecs.make_light(
            ecs.make_vec3(0.0 as f32, 4.0 as f32, 1.0 as f32),
            ecs.make_vec3(1.0 as f32, 1.0 as f32, 1.0 as f32),
            1.8 as f32,
            8.0 as f32
        )
    )

    scene.gravity = 0.0 as f32

    @append(scene.cubes, ecs.make_cube(
        ecs.make_vec3(0.0 as f32, 0.0 as f32, -2.5 as f32),
        ecs.make_vec3(0.25 as f32, 0.72 as f32, 1.00 as f32),
        1.0 as f32,
        1.0 as f32
    ))

    @append(scene.spheres, ecs.make_sphere(
        ecs.make_vec3(1.8 as f32, 0.0 as f32, -3.0 as f32),
        ecs.make_vec3(1.00 as f32, 0.42 as f32, 0.32 as f32),
        0.7 as f32
    ))

    scene.floor = some ecs.make_floor(
        -1.0 as f32,
        0.2 as f32
    )

    return scene
}

pub fn main() i32 = {
    val scenes: mut list[ecs.Scene3D] = []
    @append(scenes, build_scene())

    val app_builder: mut engine.ExoAppBuilder = engine.new_app()

    engine.with_title(app_builder, "Hello World")
    engine.with_resolution(app_builder, 1280 as i32, 720 as i32)
    engine.with_scene_list(app_builder, scenes)
    engine.with_default_camera(app_builder)
    engine.with_shaders(app_builder, engine.default_shader_config())

    engine.with_key_bindings(app_builder, rendering.default_key_bindings())
    engine.with_mouse_config(app_builder, {
        enabled:       true,
        sensitivity_x: 0.002 as f32,
        sensitivity_y: 0.002 as f32,
        invert_y:      false
    })
    engine.with_quit_key(app_builder, engine.SDL_SCANCODE_ESCAPE)

    val app: engine.ExoApp = engine.build_app(app_builder)

    return trust engine.run_app(app)
}
```

License: GPL-3.0-only
