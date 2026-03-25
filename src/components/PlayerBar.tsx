import { useEffect, useState } from "react";
import { type PlayerState, player } from "../lib/player";
import type { SubsonicClient } from "../lib/subsonic";

interface PlayerBarProps {
  client: SubsonicClient;
  onAlbumClick?: (albumId: string) => void;
}

function formatTime(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PlayerBar({ client, onAlbumClick }: PlayerBarProps) {
  const [state, setState] = useState<PlayerState>(player.getState());
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    return player.subscribe(setState);
  }, []);

  useEffect(() => {
    async function loadCover() {
      if (state.currentTrack?.coverArt) {
        const url = await client.getCoverArtUrlWithAuth(
          state.currentTrack.coverArt,
          100,
        );
        setCoverUrl(url);
      } else {
        setCoverUrl(null);
      }
    }
    loadCover();
  }, [state.currentTrack, client]);

  if (!state.currentTrack) {
    return null;
  }

  const progress =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-2 py-2 shadow-[0_-1px_rgba(255,255,255,0.05)_inset]">
      <div className="flex items-center justify-between gap-10">
        {/* Track info */}
        <div className="flex flex-col gap-2 min-w-0 w-full">
          <button
            type="button"
            onClick={() => onAlbumClick?.(state.currentTrack!.albumId)}
            className="flex items-center gap-2 min-w-0 hover:bg-zinc-800 rounded-sm p-1 transition-colors cursor-pointer group"
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={state.currentTrack.album}
                className="w-9 h-9 rounded-sm border border-zinc-800"
              />
            ) : (
              <div className="w-9 h-9 rounded-sm bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-zinc-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="No cover"
                >
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
            <div className="min-w-0 text-left">
              <p className="font-medium text-sm text-zinc-200 truncate group-hover:text-indigo-400 transition-colors">
                {state.currentTrack.title}
              </p>
              <p className="text-zinc-500 text-sm truncate group-hover:text-zinc-400 transition-colors">
                {state.currentTrack.artist}
              </p>
            </div>
          </button>

          {/* Progress bar */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-zinc-500 w-8 text-right">
              {formatTime(state.currentTime)}
            </span>
            <div
              className="flex-1 h-1 bg-zinc-800 rounded-sm cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                player.seek(percent * state.duration);
              }}
              onKeyDown={() => {}}
              role="slider"
              aria-label="Seek"
              aria-valuenow={state.currentTime}
              aria-valuemin={0}
              aria-valuemax={state.duration}
              tabIndex={0}
            >
              <div
                className="h-full bg-indigo-500 rounded-sm relative group-hover:bg-indigo-400 transition-colors"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-sm text-zinc-500 w-8">
              {formatTime(state.duration)}
            </span>
          </div>
        </div>

        {/* Controls and Volume */}
        <div className="flex items-center gap-4 justify-self-end">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => player.previous()}
              className="p-1.5 hover:bg-zinc-800 rounded-sm transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <svg
                className="w-3.5 h-3.5 text-zinc-400"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => player.togglePlayPause()}
              className="p-2 rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 hover:from-indigo-400/90 hover:to-indigo-800/80 transition-colors shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] cursor-pointer"
              aria-label={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isPlaying ? (
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => player.next()}
              className="p-1.5 hover:bg-zinc-800 rounded-sm transition-colors cursor-pointer"
              aria-label="Next"
            >
              <svg
                className="w-3.5 h-3.5 text-zinc-400"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => player.stop()}
              className="p-1.5 hover:bg-zinc-800 rounded-sm transition-colors cursor-pointer"
              aria-label="Stop"
            >
              <svg
                className="w-3.5 h-3.5 text-zinc-400"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => player.setVolume(state.volume === 0 ? 1 : 0)}
              className="p-1 hover:bg-zinc-800 rounded-sm transition-colors cursor-pointer"
              aria-label={state.volume === 0 ? "Unmute" : "Mute"}
            >
              {state.volume === 0 ? (
                <svg
                  className="w-3.5 h-3.5 text-zinc-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5 text-zinc-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.volume}
              onChange={(e) => player.setVolume(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-sm appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-zinc-300 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:bg-zinc-100"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
