entry "./src/main.sx"
version "v0.0.1"

build release {
    flags "--release"
    output "./exo"
}

build dev {
    output "./exo-dev"
}
