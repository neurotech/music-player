import { useCallback, useEffect, useState } from "react";

import { AlbumGrid } from "@/features/albums/components/AlbumGrid";
import { AlbumView } from "@/features/albums/components/AlbumView";
import { SearchModal } from "@/features/albums/components/SearchModal";
import { ConnectionForm } from "@/features/auth/components/ConnectionForm";
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
} from "@/features/auth/lib/credentials";
import { ImmersiveNowPlaying } from "@/features/player/components/immersive/ImmersiveNowPlaying";
import { NowPlayingHeader } from "@/features/player/components/NowPlayingHeader";
import { PlayerBar } from "@/features/player/components/PlayerBar";
import { QueueSidebar } from "@/features/player/components/QueueSidebar";
import { player } from "@/features/player/lib/player";
import { syncPlayerWithClient } from "@/features/player/lib/sync-player-with-client";
import { RadioList } from "@/features/radio/components/RadioList";
import { SettingsModal } from "@/features/settings/components/SettingsModal";
import { connectSubsonicClient } from "@/lib/connect-subsonic";
import type { SubsonicClient } from "@/lib/subsonic-client";
import {
  loadUIState,
  setIsQueueOpen as persistIsQueueOpen,
  setSelectedAlbumId as persistSelectedAlbumId,
} from "@/lib/ui-state";
import type { SubsonicCredentials } from "@/types/subsonic";

import { useAlbumNavigation } from "./useAlbumNavigation";
import { useAppGlobalShortcuts } from "./useAppGlobalShortcuts";
import { useMouseBackForward } from "./useMouseBackForward";
import { useSpacePlayPause } from "./useSpacePlayPause";

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
  const [activeView, setActiveView] = useState<"albums" | "radio">("albums");
  const [isImmersiveNowPlayingOpen, setIsImmersiveNowPlayingOpen] =
    useState(false);

  const {
    navigateTo,
    navigateBack,
    navigateForward,
    resetHistory,
    restoreHistoryFromAlbum,
  } = useAlbumNavigation(setSelectedAlbumId);

  const navigateToAlbum = useCallback(
    (albumId: string) => navigateTo(albumId),
    [navigateTo],
  );

  const openSearch = useCallback(() => setIsSearchOpen(true), []);

  const toggleImmersiveNowPlaying = useCallback(() => {
    setIsImmersiveNowPlayingOpen((open) => {
      if (!client) return false;
      return !open;
    });
  }, [client]);

  useAppGlobalShortcuts(navigateToAlbum, openSearch, toggleImmersiveNowPlaying);
  useMouseBackForward(navigateBack, navigateForward);
  useSpacePlayPause();

  useEffect(() => {
    if (!client) setIsImmersiveNowPlayingOpen(false);
  }, [client]);

  useEffect(() => {
    loadCredentials()
      .then(async (creds) => {
        if (creds) {
          setSavedCredentials(creds);
          setIsConnecting(true);
          try {
            const result = await connectSubsonicClient(creds);
            if (result.ok) {
              setClient(result.client);
              await syncPlayerWithClient(result.client);

              const uiState = await loadUIState();
              if (uiState.selectedAlbumId) {
                setSelectedAlbumId(uiState.selectedAlbumId);
                restoreHistoryFromAlbum(uiState.selectedAlbumId);
              }
              setIsQueueOpen(uiState.isQueueOpen);
            } else {
              setError(result.error);
            }
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Failed to connect to server",
            );
          } finally {
            setIsConnecting(false);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load credentials:", err);
      });
  }, [restoreHistoryFromAlbum]);

  async function handleConnect(credentials: SubsonicCredentials) {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await connectSubsonicClient(credentials);

      if (result.ok) {
        await saveCredentials(credentials);
        setSavedCredentials(credentials);
        setClient(result.client);
        await syncPlayerWithClient(result.client);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to server",
      );
    } finally {
      setIsConnecting(false);
    }
  }

  const handleDisconnect = useCallback(async () => {
    await clearCredentials();
    player.setClient(null);
    setClient(null);
    setSavedCredentials(null);
    setSelectedAlbumId(null);
    persistSelectedAlbumId(null);
    setActiveView("albums");
    resetHistory();
  }, [resetHistory]);

  function handleViewChange(view: "albums" | "radio") {
    setActiveView(view);
    if (view === "radio") {
      setSelectedAlbumId(null);
      persistSelectedAlbumId(null);
    }
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {client && <NowPlayingHeader client={client} onAlbumClick={navigateTo} />}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
          <div className="mx-auto flex w-full max-w-7xl flex-1 animate-fade-in flex-col overflow-hidden p-4 pb-16">
            {client ? (
              <>
                {activeView === "radio" ? (
                  <RadioList client={client} />
                ) : selectedAlbumId ? (
                  <AlbumView
                    albumId={selectedAlbumId}
                    client={client}
                    onBack={() => navigateTo(null)}
                  />
                ) : (
                  <AlbumGrid
                    client={client}
                    onAlbumClick={navigateTo}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onDisconnect={handleDisconnect}
                  />
                )}
                <PlayerBar
                  onQueueClick={() => {
                    const newState = !isQueueOpen;
                    setIsQueueOpen(newState);
                    persistIsQueueOpen(newState);
                  }}
                  isQueueOpen={isQueueOpen}
                  activeView={activeView}
                  onViewChange={handleViewChange}
                  isImmersiveOpen={isImmersiveNowPlayingOpen}
                  onImmersiveToggle={toggleImmersiveNowPlaying}
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
      {client && isImmersiveNowPlayingOpen && (
        <ImmersiveNowPlaying
          client={client}
          onClose={() => setIsImmersiveNowPlayingOpen(false)}
        />
      )}
    </main>
  );
}

export default App;
