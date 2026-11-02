entry "./src/main.sx"
spectre_version "v0.0.12"
version "v0.0.1"

build release {
    flags "--alt=clang --release"
    output "./exo"
}

build dev {
    flags "--alt=clang"
    output "./exo-dev"
}
