#!/usr/bin/env fish

set -l script_dir (dirname (status filename))
set -l app_path "$script_dir/src-tauri/target/release/music-player"

if test -x $app_path
    exec $app_path $argv
else
    echo "Error: music-player not found or not executable at $app_path" >&2
    exit 1
end
