import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Album, AlbumListType, SubsonicClient } from "../lib/subsonic";

interface AlbumGridProps {
  client: SubsonicClient;
  onDisconnect: () => void;
  onAlbumClick: (albumId: string) => void;
  onOpenSettings: () => void;
}

interface AlbumCardProps {
  album: Album;
  coverUrl: string | undefined;
  onAlbumClick: (albumId: string) => void;
}

const AlbumCard = memo(function AlbumCard({
  album,
  coverUrl,
  onAlbumClick,
}: AlbumCardProps) {
  const handleClick = useCallback(() => {
    onAlbumClick(album.id);
  }, [onAlbumClick, album.id]);

  return (
    <button
      type="button"
      className="group cursor-pointer text-left"
      style={{ contain: "layout style paint" }}
      title={`${album.name} by ${album.artist}`}
      onClick={handleClick}
    >
      <div className="aspect-square bg-zinc-900 rounded-sm overflow-hidden mb-1.5 border border-zinc-800">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={album.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">
            <svg
              className="w-8 h-8"
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
      <h3 className="font-medium text-sm truncate text-zinc-200 group-hover:text-indigo-400">
        {album.name}
      </h3>
      <p className="text-zinc-500 text-sm truncate">{album.artist}</p>
      {album.year && <p className="text-zinc-600 text-sm">{album.year}</p>}
    </button>
  );
});

type SortDirection = "asc" | "desc";

interface SortConfig {
  type: AlbumListType;
  label: string;
}

const SORT_OPTIONS: SortConfig[] = [
  { type: "newest", label: "Recently Added" },
  { type: "recent", label: "Recently Played" },
  { type: "frequent", label: "Most Played" },
  { type: "alphabeticalByName", label: "Name" },
  { type: "alphabeticalByArtist", label: "Artist" },
];

const COLUMN_COUNTS = {
  base: 3,
  sm: 4,
  md: 5,
  lg: 6,
  xl: 8,
};

function useColumnCount() {
  const [columnCount, setColumnCount] = useState(COLUMN_COUNTS.base);

  useEffect(() => {
    function updateColumnCount() {
      const width = window.innerWidth;
      if (width >= 1280) setColumnCount(COLUMN_COUNTS.xl);
      else if (width >= 1024) setColumnCount(COLUMN_COUNTS.lg);
      else if (width >= 768) setColumnCount(COLUMN_COUNTS.md);
      else if (width >= 640) setColumnCount(COLUMN_COUNTS.sm);
      else setColumnCount(COLUMN_COUNTS.base);
    }

    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);
    return () => window.removeEventListener("resize", updateColumnCount);
  }, []);

  return columnCount;
}

export const AlbumGrid = memo(function AlbumGrid({
  client,
  onDisconnect,
  onAlbumClick,
  onOpenSettings,
}: AlbumGridProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const [sortType, setSortType] = useState<AlbumListType>("newest");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const parentRef = useRef<HTMLDivElement>(null);
  const columnCount = useColumnCount();

  const fetchAlbums = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const albumList = await client.getAlbumList(sortType, 100);

      const sortedAlbums =
        sortDirection === "asc" ? [...albumList].reverse() : albumList;

      setAlbums(sortedAlbums);

      const urlEntries = await Promise.all(
        sortedAlbums.map(async (album) => {
          if (album.coverArt) {
            const url = await client.getCoverArtUrlWithAuth(
              album.coverArt,
              300,
            );
            return [album.id, url] as const;
          }
          return null;
        }),
      );

      const urls: Record<string, string> = {};
      for (const entry of urlEntries) {
        if (entry) {
          urls[entry[0]] = entry[1];
        }
      }
      setCoverUrls(urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch albums");
    } finally {
      setLoading(false);
    }
  }, [client, sortType, sortDirection]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  function toggleDirection() {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  }

  const rowCount = Math.ceil(albums.length / columnCount);
  const ROW_HEIGHT = 200;
  const GAP = 12;

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT + GAP,
    overscan: 2,
  });

  const albumRows = useMemo(() => {
    const rows: Album[][] = [];
    for (let i = 0; i < albums.length; i += columnCount) {
      rows.push(albums.slice(i, i + columnCount));
    }
    return rows;
  }, [albums, columnCount]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Albums{" "}
          <span className="text-zinc-500 font-normal">({albums.length})</span>
        </h2>

        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-zinc-500">
            Sort:
          </label>
          <select
            id="sort-select"
            value={sortType}
            onChange={(e) => setSortType(e.target.value as AlbumListType)}
            className="px-2 py-1 text-sm rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.type} value={option.type}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={toggleDirection}
            className="p-1 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
            title={sortDirection === "desc" ? "Descending" : "Ascending"}
          >
            {sortDirection === "desc" ? (
              <svg
                className="w-3.5 h-3.5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Sort descending"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Sort ascending"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
            title="Settings"
          >
            <svg
              className="w-3.5 h-3.5 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Settings"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={onDisconnect}
            className="px-2 py-1 text-sm font-semibold rounded-sm border border-zinc-900 bg-red-600 bg-linear-to-b from-red-400/60 to-red-800 hover:from-red-400/90 hover:to-red-800/80 transition-colors shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] cursor-pointer select-none ml-1"
          >
            Disconnect
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-zinc-500">Loading albums...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : albums.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center">No albums found</p>
      ) : (
        <div
          ref={parentRef}
          className="h-[calc(100vh-10rem)] overflow-auto"
          style={{ contain: "strict" }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowAlbums = albumRows[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="grid gap-3"
                  data-grid-cols={columnCount}
                >
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                    }}
                  >
                    {rowAlbums.map((album) => (
                      <AlbumCard
                        key={album.id}
                        album={album}
                        coverUrl={coverUrls[album.id]}
                        onAlbumClick={onAlbumClick}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
