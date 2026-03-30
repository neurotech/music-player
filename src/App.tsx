import { invoke } from "@tauri-apps/api/core";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlbumGrid } from "./components/AlbumGrid";
import { AlbumView } from "./components/AlbumView";
import { ConnectionForm } from "./components/ConnectionForm";
import { NowPlayingHeader } from "./components/NowPlayingHeader";
import { PlayerBar } from "./components/PlayerBar";
import { QueueSidebar } from "./components/QueueSidebar";
import { SearchModal } from "./components/SearchModal";
import { SettingsModal } from "./components/SettingsModal";
import { player } from "./lib/player";
import {
  clearCredentials,
  loadCredentials,
  SubsonicClient,
  type SubsonicCredentials,
  saveCredentials,
} from "./lib/subsonic";
import {
  loadUIState,
  setIsQueueOpen as persistIsQueueOpen,
  setSelectedAlbumId as persistSelectedAlbumId,
} from "./lib/ui-state";

function App() {
  const [client, setClient] = useState<SubsonicClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCredentials, setSavedCredentials] =
    useState<SubsonicCredentials | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Navigation history for mouse back/forward buttons
  const historyStack = useRef<(string | null)[]>([null]);
  const historyIndex = useRef(0);
  const isNavigatingRef = useRef(false);

  const navigateTo = useCallback((albumId: string | null) => {
    if (isNavigatingRef.current) {
      setSelectedAlbumId(albumId);
      persistSelectedAlbumId(albumId);
      return;
    }

    // Truncate forward history when navigating to a new location
    historyStack.current = historyStack.current.slice(
      0,
      historyIndex.current + 1,
    );
    historyStack.current.push(albumId);
    historyIndex.current = historyStack.current.length - 1;
    setSelectedAlbumId(albumId);
    persistSelectedAlbumId(albumId);
  }, []);

  const navigateBack = useCallback(() => {
    if (historyIndex.current > 0) {
      isNavigatingRef.current = true;
      historyIndex.current--;
      setSelectedAlbumId(historyStack.current[historyIndex.current]);
      isNavigatingRef.current = false;
    }
  }, []);

  const navigateForward = useCallback(() => {
    if (historyIndex.current < historyStack.current.length - 1) {
      isNavigatingRef.current = true;
      historyIndex.current++;
      setSelectedAlbumId(historyStack.current[historyIndex.current]);
      isNavigatingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadCredentials()
      .then(async (creds) => {
        if (creds) {
          setSavedCredentials(creds);
          setIsConnecting(true);
          const newClient = new SubsonicClient(creds);
          try {
            const success = await newClient.ping();
            if (success) {
              setClient(newClient);
              player.setClient(newClient);
              await player.restorePlayback();

              const uiState = await loadUIState();
              if (uiState.selectedAlbumId) {
                setSelectedAlbumId(uiState.selectedAlbumId);
                historyStack.current = [null, uiState.selectedAlbumId];
                historyIndex.current = 1;
              }
              setIsQueueOpen(uiState.isQueueOpen);
            }
          } finally {
            setIsConnecting(false);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load credentials:", err);
      });
  }, []);

  useEffect(() => {
    const NEXT_TRACK_SHORTCUT = "Control+Command+PageDown";
    const PREV_TRACK_SHORTCUT = "Control+Command+PageUp";
    const PLAY_PAUSE_SHORTCUT = "Control+Command+Home";
    const VOLUME_UP_SHORTCUT = "Control+Command+ArrowUp";
    const VOLUME_DOWN_SHORTCUT = "Control+Command+ArrowDown";
    const SEARCH_SHORTCUT = "Control+Command+KeyL";
    const RANDOM_SONG_SHORTCUT = "Control+Command+Backspace";

    const VOLUME_STEP = 0.1;

    async function registerShortcuts() {
      try {
        await unregister(NEXT_TRACK_SHORTCUT).catch(() => {});
        await unregister(PREV_TRACK_SHORTCUT).catch(() => {});
        await unregister(PLAY_PAUSE_SHORTCUT).catch(() => {});
        await unregister(VOLUME_UP_SHORTCUT).catch(() => {});
        await unregister(VOLUME_DOWN_SHORTCUT).catch(() => {});
        await unregister(SEARCH_SHORTCUT).catch(() => {});
        await unregister(RANDOM_SONG_SHORTCUT).catch(() => {});

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
            setIsSearchOpen(true);
          }
        });
        await register(RANDOM_SONG_SHORTCUT, async (event) => {
          if (event.state === "Pressed") {
            const song = await player.playRandomSong();
            if (song?.albumId) {
              navigateTo(song.albumId);
            }
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
    };
  }, [navigateTo]);

  // Mouse back/forward button navigation (mouse4 = back, mouse5 = forward)
  useEffect(() => {
    function handleMouseButton(event: MouseEvent) {
      // Button 3 = mouse4 (back), Button 4 = mouse5 (forward)
      if (event.button === 3) {
        event.preventDefault();
        navigateBack();
      } else if (event.button === 4) {
        event.preventDefault();
        navigateForward();
      }
    }

    window.addEventListener("mouseup", handleMouseButton);
    return () => {
      window.removeEventListener("mouseup", handleMouseButton);
    };
  }, [navigateBack, navigateForward]);

  // Spacebar to toggle play/pause (only when app has focus, not in input fields)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space") return;

      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputField) return;

      event.preventDefault();
      player.togglePlayPause();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleConnect(credentials: SubsonicCredentials) {
    setIsConnecting(true);
    setError(null);

    try {
      const newClient = new SubsonicClient(credentials);
      const success = await newClient.ping();

      if (success) {
        await saveCredentials(credentials);
        setSavedCredentials(credentials);
        setClient(newClient);
        player.setClient(newClient);
        await player.restorePlayback();
      } else {
        setError("Failed to connect. Check your credentials.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to server",
      );
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleDisconnect() {
    await clearCredentials();
    player.setClient(null);
    setClient(null);
    setSavedCredentials(null);
    setSelectedAlbumId(null);
    persistSelectedAlbumId(null);
    // Reset navigation history
    historyStack.current = [null];
    historyIndex.current = 0;
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {client && <NowPlayingHeader client={client} onAlbumClick={navigateTo} />}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
          <div className="mx-auto flex w-full max-w-7xl flex-1 animate-fade-in flex-col overflow-hidden p-4 pb-16">
            {client ? (
              <>
                {selectedAlbumId ? (
                  <AlbumView
                    albumId={selectedAlbumId}
                    client={client}
                    onBack={() => navigateTo(null)}
                  />
                ) : (
                  <AlbumGrid
                    client={client}
                    onDisconnect={handleDisconnect}
                    onAlbumClick={(albumId) => navigateTo(albumId)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                  />
                )}
                <PlayerBar
                  onQueueClick={() => {
                    const newState = !isQueueOpen;
                    setIsQueueOpen(newState);
                    persistIsQueueOpen(newState);
                  }}
                  isQueueOpen={isQueueOpen}
                />
                <SettingsModal
                  isOpen={isSettingsOpen}
                  onClose={() => setIsSettingsOpen(false)}
                />
                <SearchModal
                  isOpen={isSearchOpen}
                  onClose={() => setIsSearchOpen(false)}
                  client={client}
                  onAlbumClick={navigateTo}
                />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <ConnectionForm
                  onConnect={handleConnect}
                  isConnecting={isConnecting}
                  error={error}
                  initialCredentials={savedCredentials}
                />
              </div>
            )}
          </div>
        </div>
        {client && (
          <QueueSidebar
            isOpen={isQueueOpen}
            onClose={() => {
              setIsQueueOpen(false);
              persistIsQueueOpen(false);
            }}
            client={client}
            onAlbumClick={navigateTo}
          />
        )}
      </div>
    </main>
  );
}

export default App;
