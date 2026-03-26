import { ChevronLeft, Music, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { type PlayerState, player } from "../lib/player";
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

function AnimatedText({ text, paused }: { text: string; paused: boolean }) {
  const chars = text.split("").map((char, i) => ({
    char,
    id: `char-${i}`,
    delay: i * 100,
  }));

  const animationStyle = paused ? { animationPlayState: "paused" as const } : {};
  const opacityStyle = paused ? { filter: "grayscale(60%)" } : {};

  return (
    <span className="inline-flex">
      {chars.map(({ char, id, delay }) => (
        <span
          key={id}
          className="inline-block animate-wobble"
          style={{ animationDelay: `${delay}ms`, ...animationStyle }}
        >
          <span
            className="animate-rainbow"
            style={{ animationDelay: `${delay}ms`, ...animationStyle, ...opacityStyle }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        </span>
      ))}
    </span>
  );
}

export function AlbumView({ albumId, client, onBack }: AlbumViewProps) {
  const [album, setAlbum] = useState<AlbumWithSongs | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(player.getState());

  useEffect(() => {
    return player.subscribe(setPlayerState);
  }, []);

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
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="shrink-0 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 mb-4 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Albums
        </button>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="shrink-0">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={album.name}
                className="w-40 h-40 rounded-sm border border-zinc-800 shadow-lg"
              />
            ) : (
              <div className="w-40 h-40 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Music className="w-16 h-16 text-zinc-700" aria-label="No album cover" />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <p className="text-sm text-zinc-600 uppercase tracking-wider">
              Album
            </p>
            <h1 className="text-lg font-semibold text-zinc-100">
              {album.name}
            </h1>
            <p className="text-sm text-zinc-400">{album.artist}</p>
            <p className="text-sm text-zinc-500">
              {album.year && `${album.year} · `}
              {album.songCount} songs · {totalMins} min
            </p>

            <button
              type="button"
              onClick={handlePlayAll}
              className="mt-3 px-3 py-1.5 text-sm font-semibold rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 hover:from-indigo-400/90 hover:to-indigo-800/80 transition-colors shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] cursor-pointer select-none inline-flex items-center gap-1.5 w-fit"
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" />
              Play
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 max-h-full overflow-auto bg-zinc-900 border border-zinc-800 rounded-sm">
        <div className="sticky top-0 z-10 grid grid-cols-[auto_1fr_auto] gap-3 px-2 py-2 text-sm text-zinc-500 border-b border-zinc-800 bg-zinc-800">
          <span className="w-6 text-center">#</span>
          <span>Title</span>
          <span className="text-right">Duration</span>
        </div>

        {album.song?.map((song, index) => {
          const isPlaying = playerState.currentTrack?.id === song.id;
          return (
            <button
              type="button"
              key={song.id}
              onClick={() => handlePlayTrack(song, index)}
              className={`w-full grid grid-cols-[auto_1fr_auto] gap-3 px-2 py-2 hover:bg-zinc-800/40 transition-colors group items-center text-left cursor-pointer ${isPlaying ? "bg-zinc-800/50" : ""}`}
            >
              {isPlaying ? (
                <Play
                  className="w-6 text-center animate-[rainbow_7s_linear_infinite_reverse]"
                  size={12}
                  fill="currentColor"
                />
              ) : (
                <>
                  <span className="w-6 text-center text-sm text-zinc-500 group-hover:hidden">
                    {song.track || index + 1}
                  </span>
                  <Play className="w-6 text-center text-indigo-400 hidden group-hover:block" size={12} fill="currentColor" />
                </>
              )}
              <div className="min-w-0">
                <p className={`text-sm transition-colors ${isPlaying ? "" : "truncate text-zinc-200 group-hover:text-indigo-400"}`}>
                  {isPlaying ? <AnimatedText text={song.title} paused={!playerState.isPlaying} /> : song.title}
                </p>
                {song.artist !== album.artist && (
                  <p className="text-sm text-zinc-500 truncate">{song.artist}</p>
                )}
              </div>
              <span className={`w-12 text-right text-sm ${isPlaying ? "text-indigo-400" : "text-zinc-500"}`}>
                {formatDuration(song.duration)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
