import { Music, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { type PlayerState, player } from "../lib/player";
import type { SubsonicClient } from "../lib/subsonic";

interface QueueSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  client: SubsonicClient;
  onAlbumClick: (albumId: string) => void;
}

export function QueueSidebar({ isOpen, onClose, client, onAlbumClick }: QueueSidebarProps) {
  const [state, setState] = useState<PlayerState>(player.getState());
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    return player.subscribe(setState);
  }, []);

  useEffect(() => {
    async function loadCovers() {
      const urls: Record<string, string> = {};
      for (const song of state.queue) {
        if (song.coverArt) {
          urls[song.coverArt] = await client.getCoverArtUrlWithAuth(
            song.coverArt,
            80,
          );
        }
      }
      if (Object.keys(urls).length > 0) {
        setCoverUrls(urls);
      }
    }
    loadCovers();
  }, [state.queue, client]);

  return (
    <div
      className={`flex flex-col border-zinc-800 border-l bg-zinc-900 shadow-xl transition-all duration-300 ${
        isOpen ? "w-80" : "w-0 border-l-0"
      } overflow-hidden`}
    >
      <div className="flex h-full w-80 flex-col">
        <div className="flex items-center justify-between border-zinc-800 border-b px-4 py-3">
          <h2 className="font-semibold text-zinc-200">Queue</h2>
          <div className="flex items-center gap-1">
            {state.queue.length > 0 && (
              <button
                type="button"
                onClick={() => player.stop()}
                className="cursor-pointer rounded-sm p-1.5 transition-colors hover:bg-zinc-800"
                aria-label="Clear queue"
                title="Clear queue"
              >
                <Trash2 className="h-4 w-4 text-zinc-400" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-sm p-1.5 transition-colors hover:bg-zinc-800"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-16">
          {state.queue.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-zinc-500">
              <Music className="mb-2 h-8 w-8" />
              <p className="text-sm">Queue is empty</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {state.queue.map((song, index) => {
                const isCurrentTrack = index === state.queueIndex;
                const coverUrl = song.coverArt
                  ? coverUrls[song.coverArt]
                  : null;

                return (
                  <button
                    type="button"
                    key={`${song.id}-${song.albumId}-${song.track ?? index}`}
                    className={`flex w-full cursor-pointer items-center gap-3 px-2 py-2 text-left transition-colors ${
                      isCurrentTrack
                        ? "bg-indigo-400 hover:bg-indigo-400"
                        : "hover:bg-zinc-800/50"
                    }`}
                    onClick={() => {
                      if (isCurrentTrack) {
                        if (song.albumId) {
                          onAlbumClick(song.albumId);
                        }
                      } else {
                        player.playQueue(state.queue, index);
                      }
                    }}
                  >
                    <span className="w-2 shrink-0 text-center text-xs text-zinc-500">
                      {isCurrentTrack && state.isPlaying ? (
                        <span className="text-indigo-900">▶</span>
                      ) : (
                        index + 1
                      )}
                    </span>
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={song.album}
                        className={`h-9 w-9 shrink-0 rounded-sm border border-zinc-700 transition-colors ${isCurrentTrack ? "bg-indigo-500" : ""}`}
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-800 transition-colors">
                        <Music className="h-4 w-4 text-zinc-600" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm transition-colors ${
                          isCurrentTrack
                            ? "font-medium text-black/75"
                            : "text-zinc-200"
                        }`}
                      >
                        {song.title}
                      </p>
                      <p
                        className={`text-xs transition-colors ${isCurrentTrack ? "text-black/50" : "text-zinc-500"} truncate`}
                      >
                        {song.artist}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
