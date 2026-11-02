# Exo

A simple 3D game engine designed for ease of use and performance.

Built on the <a href="https://github.com/spectrelang/spectre">Spectre</a> programming language.

Currently supports:

- Modular engine modules with a small high-level app API
- Full ECS-style scene model
- Builtin physics system
- Audio subsystem
- Input system
- GLB model rendering with textures
- Simple 3D graphical primitives
- Reflective, animated water effects
- Particle/glow billboards

## Library Layout

| Module | Responsibility |
|--------|----------------|
| `engine.sx` | App lifecycle, builder API, defaults, main loop |
| `engine/sdl.sx` | SDL3 bindings, constants, and link directives |
| `engine/math.sx` | `Vec3`, `Vec4f`, `Mat4`, and math helpers |
| `engine/camera.sx` | Camera state, movement, and view/projection |
| `engine/input.sx` | Key bindings, mouse settings, key lookup |
| `engine/audio.sx` | WAV loading and playback |
| `engine/shaders.sx` | Shader paths and platform shader format |
| `engine/io.sx` | Binary file loading |
| `engine/glb.sx` | GLB parsing and bounds |
| `engine/mesh.sx` | Procedural meshes and GLB mesh upload |
| `engine/renderer.sx` | SDL_GPU renderer, pipelines, and passes |
| `ecs.sx` | Scene/entity data model |

Every module can be imported directly, so gameplay code can depend on only the
parts it needs.

## Example Usage

```spectre
val ecs       = use("ecs.sx")
val engine    = use("engine.sx")
val rendering = use("rendering.sx")
val sdl       = use("engine/sdl.sx")
val input     = use("engine/input.sx")

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

    val water = ecs.make_water(
        -0.2 as f32,
        0.0 as f32,
        0.0 as f32,
        8.0 as f32,
        8.0 as f32,
        ecs.make_vec3(0.10 as f32, 0.46 as f32, 0.78 as f32),
        1.2 as f32,
        0.02 as f32,
        3.0 as f32,
        0.4 as f32
    )
    scene.water = some water

    return scene
}

pub fn main() i32 = {
    val scenes: mut list[ecs.Scene3D] = []
    @append(scenes, build_scene())

    val input_cfg: input.InputConfig = {
        keys: rendering.default_key_bindings(),
        mouse: {
            enabled: true,
            sensitivity_x: 0.0018 as f32,
            sensitivity_y: 0.0018 as f32,
            invert_y: false
        },
        quit_key: sdl.SDL_SCANCODE_ESCAPE
    }

    val builder: mut engine.ExoAppBuilder = engine.new_app()

    engine.with_title(builder, "Hello World")
    engine.with_resolution(builder, 1280 as i32, 720 as i32)
    engine.with_scene_list(builder, scenes)
    engine.with_default_camera(builder)
    engine.with_input(builder, input_cfg)
    engine.with_next_scene_key(builder, sdl.SDL_SCANCODE_X)

    val app: engine.ExoApp = engine.build_app(builder)
    return trust engine.run_app(app)
}
```

Run the bundled showcase with:

```sh
spectre build
./exo-dev
```

License: GPL-3.0-only
