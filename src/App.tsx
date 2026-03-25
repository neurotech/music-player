import { useEffect, useState } from "react";
import { AlbumGrid } from "./components/AlbumGrid";
import { AlbumView } from "./components/AlbumView";
import { ConnectionForm } from "./components/ConnectionForm";
import { PlayerBar } from "./components/PlayerBar";
import { SettingsModal } from "./components/SettingsModal";
import { player } from "./lib/player";
import {
  clearCredentials,
  loadCredentials,
  SubsonicClient,
  type SubsonicCredentials,
  saveCredentials,
} from "./lib/subsonic";

function App() {
  const [client, setClient] = useState<SubsonicClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCredentials, setSavedCredentials] =
    useState<SubsonicCredentials | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    loadCredentials()
      .then((creds) => {
        if (creds) {
          setSavedCredentials(creds);
          setIsConnecting(true);
          const newClient = new SubsonicClient(creds);
          newClient
            .ping()
            .then((success) => {
              if (success) {
                setClient(newClient);
                player.setClient(newClient);
              }
            })
            .finally(() => setIsConnecting(false));
        }
      })
      .catch((err) => {
        console.error("Failed to load credentials:", err);
      });
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
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-24">
      <div className="max-w-7xl mx-auto animate-fade-in">
        {client ? (
          <>
            {selectedAlbumId ? (
              <AlbumView
                albumId={selectedAlbumId}
                client={client}
                onBack={() => setSelectedAlbumId(null)}
              />
            ) : (
              <AlbumGrid
                client={client}
                onDisconnect={handleDisconnect}
                onAlbumClick={(albumId) => setSelectedAlbumId(albumId)}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}
            <PlayerBar client={client} onAlbumClick={setSelectedAlbumId} />
            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
            />
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[80vh]">
            <ConnectionForm
              onConnect={handleConnect}
              isConnecting={isConnecting}
              error={error}
              initialCredentials={savedCredentials}
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
