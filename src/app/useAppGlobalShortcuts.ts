import { invoke } from "@tauri-apps/api/core";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { platform } from "@tauri-apps/plugin-os";
import { useEffect } from "react";
import { player } from "@/features/player/lib/player";

const VOLUME_STEP = 0.1;

export function useAppGlobalShortcuts(
  navigateToAlbum: (albumId: string) => void,
  onOpenSearch: () => void,
  onToggleImmersiveNowPlaying: () => void,
) {
  useEffect(() => {
    const isMacOS = platform() === "macos";
    const OS_PREFIX = isMacOS ? "Control+Command+" : "Control+Alt+";
    const NEXT_TRACK_SHORTCUT = `${OS_PREFIX}PageDown`;
    const PREV_TRACK_SHORTCUT = `${OS_PREFIX}PageUp`;
    const PLAY_PAUSE_SHORTCUT = `${OS_PREFIX}Home`;
    const VOLUME_UP_SHORTCUT = `${OS_PREFIX}ArrowUp`;
    const VOLUME_DOWN_SHORTCUT = `${OS_PREFIX}ArrowDown`;
    const SEARCH_SHORTCUT = `${OS_PREFIX}KeyL`;
    const RANDOM_SONG_SHORTCUT = `${OS_PREFIX}Backspace`;
    const IMMERSIVE_SHORTCUT = `${OS_PREFIX}Backslash`;

    async function registerShortcuts() {
      try {
        await unregister(NEXT_TRACK_SHORTCUT).catch(() => {});
        await unregister(PREV_TRACK_SHORTCUT).catch(() => {});
        await unregister(PLAY_PAUSE_SHORTCUT).catch(() => {});
        await unregister(VOLUME_UP_SHORTCUT).catch(() => {});
        await unregister(VOLUME_DOWN_SHORTCUT).catch(() => {});
        await unregister(SEARCH_SHORTCUT).catch(() => {});
        await unregister(RANDOM_SONG_SHORTCUT).catch(() => {});
        await unregister(IMMERSIVE_SHORTCUT).catch(() => {});

        await register(NEXT_TRACK_SHORTCUT, (event) => {
          if (event.state === "Pressed") {
            player.next();
          }
        });
        await register(PREV_TRACK_SHORTCUT, (event) => {
          if (event.state === "Pressed") {
            player.previous();
          }
        });
        await register(PLAY_PAUSE_SHORTCUT, (event) => {
          if (event.state === "Pressed") {
            player.togglePlayPause();
          }
        });
        await register(VOLUME_UP_SHORTCUT, (event) => {
          if (event.state === "Pressed") {
            const currentVolume = player.getState().volume;
            player.setVolume(currentVolume + VOLUME_STEP);
          }
        });
        await register(VOLUME_DOWN_SHORTCUT, (event) => {
          if (event.state === "Pressed") {
            const currentVolume = player.getState().volume;
            player.setVolume(currentVolume - VOLUME_STEP);
          }
        });
        await register(SEARCH_SHORTCUT, (event) => {
          if (event.state === "Pressed") {
            invoke("bring_to_front");
            onOpenSearch();
          }
        });
        await register(RANDOM_SONG_SHORTCUT, async (event) => {
          if (event.state === "Pressed") {
            const song = await player.playRandomSong();
            if (song?.albumId) {
              navigateToAlbum(song.albumId);
            }
          }
        });
        await register(IMMERSIVE_SHORTCUT, (event) => {
          if (event.state === "Pressed") {
            invoke("bring_to_front");
            onToggleImmersiveNowPlaying();
          }
        });
      } catch (err) {
        console.error("Failed to register global shortcuts:", err);
      }
    }

    registerShortcuts();

    return () => {
      unregister(NEXT_TRACK_SHORTCUT).catch(() => {});
      unregister(PREV_TRACK_SHORTCUT).catch(() => {});
      unregister(PLAY_PAUSE_SHORTCUT).catch(() => {});
      unregister(VOLUME_UP_SHORTCUT).catch(() => {});
      unregister(VOLUME_DOWN_SHORTCUT).catch(() => {});
      unregister(SEARCH_SHORTCUT).catch(() => {});
      unregister(RANDOM_SONG_SHORTCUT).catch(() => {});
      unregister(IMMERSIVE_SHORTCUT).catch(() => {});
    };
  }, [navigateToAlbum, onOpenSearch, onToggleImmersiveNowPlaying]);
}
