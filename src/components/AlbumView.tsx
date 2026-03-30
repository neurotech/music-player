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

  const animationStyle = paused
    ? { animationPlayState: "paused" as const }
    : {};
  const idea = paused
    ? { animationDuration: "2s" }
    : { animationDuration: "1.2s" };
  const opacityStyle = paused ? { filter: "grayscale(100%)" } : {};

  return (
    <span className="inline-flex">
      {chars.map(({ char, id, delay }) => (
        <span
          key={id}
          className="inline-block animate-wobble"
          style={{
            animationDelay: `${delay}ms`,
            ...idea,
          }}
        >
          <span
            className="animate-rainbow text-white"
            style={{
              animationDelay: `-${delay}ms`,
              animationDuration: "15s",
              ...animationStyle,
              ...opacityStyle,
            }}
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
  const [playerState, setPlayerState] = useState<PlayerState>(
    player.getState(),
  );

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

  async function handlePlayTrack(song: Song, index: number) {
    if (playerState.currentTrack?.id === song.id) {
      player.togglePlayPause();
    } else if (album?.song) {
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
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-zinc-500">Loading album...</div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-red-400 text-sm">{error || "Album not found"}</p>
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer rounded-sm border border-zinc-900 bg-zinc-800 px-2 py-1 font-semibold text-sm transition-colors hover:bg-zinc-700"
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
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="shrink-0 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Albums
        </button>

        <div className="flex flex-col gap-4 md:flex-row">
          <button
            type="button"
            onClick={handlePlayAll}
            className="group relative shrink-0 cursor-pointer"
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={album.name}
                className="h-40 w-40 rounded-sm border border-zinc-800 shadow-lg transition-all group-hover:brightness-75"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-sm border border-zinc-800 bg-zinc-900 transition-all group-hover:brightness-75">
                <Music
                  className="h-16 w-16 text-zinc-700"
                  aria-label="No album cover"
                />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 shadow-lg">
                <Play
                  className="ml-0.5 h-6 w-6 text-white"
                  fill="currentColor"
                />
              </div>
            </div>
          </button>

          <div className="flex flex-col justify-between gap-1">
            <div>
              <h1 className="font-semibold text-4xl text-zinc-100">
                {album.name}
              </h1>
              <p className="text-xl text-zinc-400">{album.artist}</p>
            </div>

            <p className="text-sm text-zinc-500">
              {album.year && `${album.year} · `}
              {album.songCount} songs · {totalMins} min
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-full min-h-0 overflow-auto rounded-sm border border-zinc-800 bg-zinc-900">
        <div className="sticky top-0 z-10 grid grid-cols-[auto_1fr_auto] gap-3 border-zinc-800 border-b bg-zinc-800 px-2 py-2 text-sm text-zinc-500">
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
              className={`group grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 px-2 py-2 text-left transition-colors hover:bg-zinc-800/40 ${isPlaying ? "bg-zinc-800/50" : ""}`}
            >
              {isPlaying ? (
                <Play
                  className="w-6 animate-[rainbow_10s_linear_infinite_reverse] text-center"
                  size={12}
                  fill="currentColor"
                />
              ) : (
                <>
                  <span className="w-6 text-center text-sm text-zinc-500 proportional-nums group-hover:hidden">
                    {song.track || index + 1}
                  </span>
                  <Play
                    className="hidden w-6 text-center text-indigo-400 group-hover:block"
                    size={12}
                    fill="currentColor"
                  />
                </>
              )}
              <div className="min-w-0 overflow-hidden">
                <p
                  className={`truncate text-sm transition-colors ${isPlaying ? "" : "text-zinc-200 group-hover:text-indigo-400"}`}
                >
                  {isPlaying ? (
                    <AnimatedText
                      text={song.title}
                      paused={!playerState.isPlaying}
                    />
                  ) : (
                    song.title
                  )}
                </p>
                {song.artist !== album.artist && (
                  <p className="truncate text-sm text-zinc-500">
                    {song.artist}
                  </p>
                )}
              </div>
              <span
                className={`w-12 text-right text-sm ${isPlaying ? "text-white/80" : "text-zinc-500 tabular-nums"}`}
              >
                {formatDuration(song.duration)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
