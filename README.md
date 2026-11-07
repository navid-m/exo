# Exo

A simple and performant 3D game engine built on the
<a href="https://github.com/spectrelang/spectre">Spectre</a> programming
language.

The engine has no built-in notion of a level list, player, camera controller,
goal, score, or key bindings. Games receive raw input/lifecycle events and own
all gameplay state.

Run the bundled showcase with:

```sh
spectre run examples/pacman3d.sx
```

Or:

```sh
spectre examples/pacman3d.sx
./s-out/pacman3d
```

## Screenshot

<img src=".github/assets/exo-pacman.png">

## Library Layout (as of v0.0.2)

| Module               | Responsibility                                               |
| -------------------- | ------------------------------------------------------------ |
| `engine.sx`          | App lifecycle, generic event loop, scene/resource management |
| `engine/sdl.sx`      | SDL3 bindings, event structs, constants, link directives     |
| `engine/math.sx`     | `Vec3`, `Vec4f`, `Mat4`, and math helpers                    |
| `engine/camera.sx`   | Optional fly-camera state and view/projection                |
| `engine/input.sx`    | Input configuration, state, event helpers, gamepad polling   |
| `engine/audio.sx`    | WAV loading and multi-clip playback                          |
| `engine/shaders.sx`  | Shader paths and platform shader format                      |
| `engine/io.sx`       | Binary file loading                                          |
| `engine/glb.sx`      | GLB parsing and bounds                                       |
| `engine/mesh.sx`     | Procedural meshes and GLB mesh upload                        |
| `engine/renderer.sx` | SDL_GPU renderer, scene passes, HUD pipeline                 |
| `ecs.sx`             | Generic scene/entity/render/UI data model                    |
| `physics.sx`         | Gravity, floor collision, and collision/query helpers        |

Every module can be imported directly, so gameplay code can depend on only the
parts it needs.

---

License: GPL-3.0-only
