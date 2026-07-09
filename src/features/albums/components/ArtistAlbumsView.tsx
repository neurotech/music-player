import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import type { SubsonicClient } from "@/lib/subsonic-client";
import { useCoverArtUrls } from "@/lib/useCoverArtUrls";
import type { Album, Artist } from "@/types/subsonic";

import { AlbumCard } from "./AlbumGrid";

interface ArtistAlbumsViewProps {
  artistId: string;
  artistName: string;
  client: SubsonicClient;
  onAlbumClick: (albumId: string) => void;
  onBack: () => void;
}

export function ArtistAlbumsView({
  artistId,
  artistName,
  client,
  onAlbumClick,
  onBack,
}: ArtistAlbumsViewProps) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const artistRequestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++artistRequestIdRef.current;

    async function fetchArtist() {
      try {
        setLoading(true);
        setError(null);
        const artistData = await client.getArtist(artistId);
        if (requestId !== artistRequestIdRef.current) return;
        setArtist(artistData);
      } catch (err) {
        if (requestId !== artistRequestIdRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load artist");
      } finally {
        if (requestId === artistRequestIdRef.current) {
          setLoading(false);
        }
      }
    }

    fetchArtist();
    return () => {
      artistRequestIdRef.current++;
    };
  }, [artistId, client]);

  const albums = artist?.album ?? [];
  const displayName = artist?.name ?? artistName;

  const coverArtEntries = useMemo(
    () =>
      albums
        .filter((a): a is Album & { coverArt: string } => Boolean(a.coverArt))
        .map((a) => ({ key: a.id, coverArtId: a.coverArt })),
    [albums],
  );

  const coverUrls = useCoverArtUrls(client, coverArtEntries, 300);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-zinc-500">Loading artist...</div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-red-400 text-sm">{error || "Artist not found"}</p>
        <Button variant="secondary" size="sm" onClick={onBack}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
      <div className="shrink-0">
        <Button
          variant="link"
          size="sm"
          onClick={onBack}
          className="mb-2 self-start"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </Button>

        <h1 className="wrap-break-word font-semibold text-3xl text-zinc-100 sm:text-4xl">
          {displayName}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {albums.length} {albums.length === 1 ? "album" : "albums"}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {albums.length === 0 ? (
          <p className="text-sm text-zinc-500">No albums found</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                coverUrl={coverUrls[album.id]}
                onAlbumClick={onAlbumClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
