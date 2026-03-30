import { Music } from "lucide-react";
import { useEffect, useState } from "react";
import { type PlayerState, player } from "../lib/player";
import type { SubsonicClient } from "../lib/subsonic";

interface NowPlayingHeaderProps {
  client: SubsonicClient;
  onAlbumClick?: (albumId: string) => void;
}

export function NowPlayingHeader({
  client,
  onAlbumClick,
}: NowPlayingHeaderProps) {
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
      onClick={() => onAlbumClick?.(state.currentTrack?.albumId)}
      className="group sticky top-0 z-20 flex w-full min-w-0 shrink-0 cursor-pointer items-center gap-3 border-zinc-800 border-b bg-zinc-900 px-4 py-2 text-left transition-colors hover:bg-zinc-800"
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={state.currentTrack.album}
          className="h-13 w-13 rounded-sm border border-zinc-800"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-800">
          <Music className="h-5 w-5 text-zinc-600" aria-label="No cover" />
        </div>
      )}
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-xs text-zinc-500 uppercase tracking-wide">
          <Music className="h-3 w-3" /> Now Playing
        </p>
        <p className="truncate font-medium text-sm text-zinc-200">
          {state.currentTrack.title}
        </p>
        <p className="truncate text-sm text-zinc-500 transition-colors group-hover:text-zinc-400">
          {state.currentTrack.artist} — {state.currentTrack.album}
        </p>
      </div>
    </button>
  );
}
