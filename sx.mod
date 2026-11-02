entry "./src/main.sx"
spectre_version "v0.0.13"
version "v0.0.2"

build release {
    flags "--release"
    output "./exo"
}

build dev {
    output "./exo-dev"
}
