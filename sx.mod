entry "./src/main.sx"
version "v0.0.1"

build release {
    flags "--alt=clang --release --inc-path=/usr/include/SDL2/"
    output "./exo"
}

build dev {
    flags "--alt=clang --inc-path=/usr/include/SDL2/"
    output "./exo-dev"
}
