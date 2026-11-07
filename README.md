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

Every module can be imported directly, so gameplay code can depend on only the
parts it needs.

---

License: GPL-3.0-only
