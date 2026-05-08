entry "./src/main.sx"
version "v0.0.1"

build release {
    flags "--alt=clang --release"
    output "./exo"
}

build dev {
    flags "--alt=clang"
    output "./exo-dev"
}
