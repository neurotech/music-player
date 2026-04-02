import { Music } from "lucide-react";
import { useMemo } from "react";
import { CoverArt } from "@/components/CoverArt";
import type { SubsonicClient } from "@/lib/subsonic-client";
import { useCoverArtUrls } from "@/lib/useCoverArtUrls";
import { usePlayerState } from "../hooks/usePlayerState";

interface NowPlayingHeaderProps {
  client: SubsonicClient;
  onAlbumClick?: (albumId: string) => void;
}

export function NowPlayingHeader({
  client,
  onAlbumClick,
}: NowPlayingHeaderProps) {
  const state = usePlayerState();

  const coverArtId = state.currentTrack?.coverArt ?? null;
  const coverEntries = useMemo(
    () =>
      coverArtId ? [{ key: "np", coverArtId }] : [],
    [coverArtId],
  );
  const coverMap = useCoverArtUrls(client, coverEntries, 100);
  const coverUrl = coverArtId ? (coverMap.np ?? null) : null;

  if (!state.currentTrack) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        const id = state.currentTrack?.albumId;
        if (id) onAlbumClick?.(id);
      }}
      className="group sticky top-0 z-20 flex w-full min-w-0 shrink-0 cursor-pointer items-center gap-3 border-zinc-800 border-b bg-zinc-900 px-4 py-2 text-left transition-colors hover:bg-zinc-800"
    >
      <CoverArt
        url={coverUrl}
        alt={state.currentTrack.album}
        frame="header"
        imgProps={coverUrl ? { loading: "eager" } : undefined}
      />
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
