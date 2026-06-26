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
    () => (coverArtId ? [{ key: "np", coverArtId }] : []),
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
      className="group relative flex w-full min-w-0 shrink-0 cursor-pointer items-center gap-3 overflow-hidden border-zinc-800 border-b bg-zinc-900 p-3 text-left transition-colors hover:bg-zinc-800"
    >
      {coverUrl ? (
        <>
          <img
            src={coverUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-sm transition-opacity group-hover:opacity-35"
            loading="eager"
            decoding="async"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-zinc-950/70"
          />
        </>
      ) : null}
      <CoverArt
        url={coverUrl}
        alt={state.currentTrack.album}
        frame="squareSm"
        className="relative z-10"
        imgProps={coverUrl ? { loading: "eager" } : undefined}
      />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-start self-stretch">
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
