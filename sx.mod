spectre_version "v0.0.15"
version "v0.0.2"

dep "https://github.com/mackron/dr_libs.git"

build dev {
    posix {
        action "./scripts/notice.sh"
    }
    windows {
        action "./scripts/notice.cmd"
    }
}

build docs {
    action "spectre doc ./src -o ./docs"
}