import { useEffect, useState } from "react";
import { player } from "../lib/player";
import type { AlbumWithSongs, Song, SubsonicClient } from "../lib/subsonic";

interface AlbumViewProps {
  albumId: string;
  client: SubsonicClient;
  onBack: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AlbumView({ albumId, client, onBack }: AlbumViewProps) {
  const [album, setAlbum] = useState<AlbumWithSongs | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlbum() {
      try {
        setLoading(true);
        setError(null);
        const albumData = await client.getAlbum(albumId);
        setAlbum(albumData);

        if (albumData.coverArt) {
          const url = await client.getCoverArtUrlWithAuth(
            albumData.coverArt,
            400,
          );
          setCoverUrl(url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load album");
      } finally {
        setLoading(false);
      }
    }

    fetchAlbum();
  }, [albumId, client]);

  async function handlePlayTrack(_song: Song, index: number) {
    if (album?.song) {
      await player.playQueue(album.song, index);
    }
  }

  async function handlePlayAll() {
    if (album?.song && album.song.length > 0) {
      await player.playQueue(album.song, 0);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-zinc-500">Loading album...</div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-red-400">{error || "Album not found"}</p>
        <button
          type="button"
          onClick={onBack}
          className="px-2 py-1 text-sm font-semibold rounded-sm border border-zinc-900 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const totalDuration =
    album.song?.reduce((acc, s) => acc + s.duration, 0) || 0;
  const totalMins = Math.floor(totalDuration / 60);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 mb-4 transition-colors cursor-pointer"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Albums
      </button>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-shrink-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={album.name}
              className="w-40 h-40 rounded-sm border border-zinc-800 shadow-lg"
            />
          ) : (
            <div className="w-40 h-40 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-zinc-700"
                fill="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="No album cover"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-end">
          <p className="text-sm text-zinc-600 uppercase tracking-wider mb-1">
            Album
          </p>
          <h1 className="text-lg font-semibold text-zinc-100 mb-1">
            {album.name}
          </h1>
          <p className="text-sm text-zinc-400 mb-2">{album.artist}</p>
          <p className="text-sm text-zinc-500">
            {album.year && `${album.year} · `}
            {album.songCount} songs · {totalMins} min
          </p>

          <button
            type="button"
            onClick={handlePlayAll}
            className="mt-3 px-3 py-1.5 text-sm font-semibold rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 hover:from-indigo-400/90 hover:to-indigo-800/80 transition-colors shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] cursor-pointer select-none inline-flex items-center gap-1.5 w-fit"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 px-3 py-2 text-sm text-zinc-500 border-b border-zinc-800 bg-zinc-800/50">
          <span className="w-6 text-center">#</span>
          <span>Title</span>
          <span className="w-12 text-right">Duration</span>
        </div>

        {album.song?.map((song, index) => (
          <button
            type="button"
            key={song.id}
            onClick={() => handlePlayTrack(song, index)}
            className="w-full grid grid-cols-[auto_1fr_auto] gap-3 px-3 py-2 hover:bg-zinc-800/70 transition-colors group text-left cursor-pointer"
          >
            <span className="w-6 text-center text-sm text-zinc-500 group-hover:hidden">
              {song.track || index + 1}
            </span>
            <span className="w-6 text-center text-indigo-400 hidden group-hover:block">
              <svg
                className="w-3 h-3 mx-auto"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm text-zinc-200 truncate group-hover:text-indigo-400 transition-colors">
                {song.title}
              </p>
              {song.artist !== album.artist && (
                <p className="text-sm text-zinc-500 truncate">{song.artist}</p>
              )}
            </div>
            <span className="w-12 text-right text-sm text-zinc-500">
              {formatDuration(song.duration)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
