spectre_version "v0.0.14"
version "v0.0.2"

build dev {
    posix {
        action "./scripts/notice.sh"
    }
    windows {
        action "./scripts/notice.cmd"
    }
}
