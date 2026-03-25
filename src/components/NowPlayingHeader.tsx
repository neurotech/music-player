import { useEffect, useState } from "react";
import { type PlayerState, player } from "../lib/player";
import type { SubsonicClient } from "../lib/subsonic";

interface NowPlayingHeaderProps {
  client: SubsonicClient;
  onAlbumClick?: (albumId: string) => void;
}

export function NowPlayingHeader({ client, onAlbumClick }: NowPlayingHeaderProps) {
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

  return (
    <button
      type="button"
      onClick={() => onAlbumClick?.(state.currentTrack!.albumId)}
      className="sticky top-0 z-20 w-full bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center gap-3 min-w-0 hover:bg-zinc-800 transition-colors cursor-pointer group text-left shrink-0"
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={state.currentTrack.album}
          className="w-13 h-13 rounded-sm border border-zinc-800"
        />
      ) : (
        <div className="w-10 h-10 rounded-sm bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-zinc-600"
            fill="currentColor"
            viewBox="0 0 24 24"
            role="img"
            aria-label="No cover"
          >
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 uppercase tracking-wide">🎵 Now Playing</p>
        <p className="font-medium text-sm text-zinc-200 truncate">
          {state.currentTrack.title}
        </p>
        <p className="text-zinc-500 text-sm truncate group-hover:text-zinc-400 transition-colors">
          {state.currentTrack.artist} — {state.currentTrack.album}
        </p>
      </div>
    </button>
  );
}
