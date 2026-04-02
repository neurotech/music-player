import { Music, Trash2, X } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/Button";
import { CoverArt } from "@/components/CoverArt";
import type { SubsonicClient } from "@/lib/subsonic-client";
import { useCoverArtUrls } from "@/lib/useCoverArtUrls";
import { usePlayerState } from "../hooks/usePlayerState";
import { player } from "../lib/player";

interface QueueSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  client: SubsonicClient;
  onAlbumClick: (albumId: string) => void;
}

export function QueueSidebar({
  isOpen,
  onClose,
  client,
  onAlbumClick,
}: QueueSidebarProps) {
  const state = usePlayerState();

  const coverEntries = useMemo(() => {
    const ids = [
      ...new Set(
        state.queue
          .map((s) => s.coverArt)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    return ids.map((id) => ({ key: id, coverArtId: id }));
  }, [state.queue]);

  const coverUrls = useCoverArtUrls(client, coverEntries, 80);

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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => player.stop()}
                aria-label="Clear queue"
                title="Clear queue"
              >
                <Trash2 className="h-4 w-4 text-zinc-400" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </Button>
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
                  : undefined;

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
                    <CoverArt
                      url={coverUrl ?? null}
                      alt={song.album}
                      frame="squareSm"
                      className={isCurrentTrack ? "bg-indigo-500" : ""}
                    />
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
