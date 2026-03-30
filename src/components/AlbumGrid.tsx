import {
  Music,
  Search,
  Settings,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
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
      className="group flex cursor-pointer flex-col items-start text-left"
      style={{ contain: "layout style paint" }}
      title={`${album.name} by ${album.artist}`}
      onClick={handleClick}
    >
      <div className="mb-1.5 aspect-square overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={album.name}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-700">
            <Music className="h-8 w-8" aria-label="No album cover" />
          </div>
        )}
      </div>
      {album.name && album.name !== "[Unknown Album]" ? (
        <>
          <h3 className="truncate font-medium text-sm text-zinc-200 group-hover:text-indigo-400">
            {album.name}
          </h3>
          <p className="truncate text-sm text-zinc-500">{album.artist}</p>
        </>
      ) : (
        <>
          <h3 className="truncate font-medium text-sm text-zinc-200 group-hover:text-indigo-400">
            {album.artist}
          </h3>
          <p className="truncate text-sm text-zinc-800">?</p>
        </>
      )}
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

const PAGE_SIZE = 50;

export const AlbumGrid = memo(function AlbumGrid({
  client,
  onAlbumClick,
  onOpenSettings,
}: AlbumGridProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const [sortType, setSortType] = useState<AlbumListType>("newest");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Album[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTotalPages = useCallback(async () => {
    let low = 0;
    let high = 100;

    while (
      await client
        .getAlbumList(sortType, 1, high * PAGE_SIZE)
        .then((r) => r.length > 0)
    ) {
      low = high;
      high *= 2;
    }

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const result = await client.getAlbumList(sortType, 1, mid * PAGE_SIZE);
      if (result.length > 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    setTotalPages(low);
  }, [client, sortType]);

  const fetchAlbums = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = currentPage * PAGE_SIZE;
      const albumList = await client.getAlbumList(sortType, PAGE_SIZE, offset);

      setHasMore(albumList.length === PAGE_SIZE);

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
  }, [client, sortType, sortDirection, currentPage]);

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults(null);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const results = await client.search(query);

        const albumMap = new Map<string, Album>();

        if (results.album) {
          for (const album of results.album) {
            albumMap.set(album.id, album);
          }
        }

        if (results.song) {
          for (const song of results.song) {
            if (song.albumId && !albumMap.has(song.albumId)) {
              albumMap.set(song.albumId, {
                id: song.albumId,
                name: song.album,
                artist: song.artist,
                artistId: song.artistId,
                coverArt: song.coverArt,
                songCount: 0,
                duration: 0,
              });
            }
          }
        }

        const uniqueAlbums = Array.from(albumMap.values());
        setSearchResults(uniqueAlbums);

        const newUrls: Record<string, string> = { ...coverUrls };
        const urlEntries = await Promise.all(
          uniqueAlbums
            .filter(
              (album): album is Album & { coverArt: string } =>
                !!album.coverArt && !newUrls[album.id],
            )
            .map(async (album) => {
              const url = await client.getCoverArtUrlWithAuth(
                album.coverArt,
                300,
              );
              return [album.id, url] as const;
            }),
        );

        for (const entry of urlEntries) {
          newUrls[entry[0]] = entry[1];
        }
        setCoverUrls(newUrls);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setIsSearching(false);
      }
    },
    [client, coverUrls],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (!query.trim()) {
        setSearchResults(null);
        return;
      }

      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    },
    [performSearch],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  useEffect(() => {
    fetchTotalPages();
  }, [fetchTotalPages]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  function toggleDirection() {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    setCurrentPage(0);
  }

  function handleSortTypeChange(newSortType: AlbumListType) {
    setSortType(newSortType);
    setCurrentPage(0);
    setTotalPages(null);
  }

  function goToPreviousPage() {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }

  function goToNextPage() {
    setCurrentPage((prev) => prev + 1);
  }

  const displayAlbums = searchResults !== null ? searchResults : albums;
  const showSearchLoading = isSearching && searchQuery.trim();

  return (
    <div className="flex h-full w-full flex-col">
      {/* Sticky search/sort header */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-zinc-950 pb-4">
        <div className="relative max-w-xs flex-1">
          <input
            type="text"
            placeholder="Search albums, artists, tracks..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full rounded-sm border border-zinc-800 bg-zinc-900 py-1 pr-8 pl-8 text-sm text-zinc-300 placeholder-zinc-600 transition-colors focus:border-indigo-500 focus:outline-none"
          />
          <Search
            className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-label="Search"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
              title="Clear search"
            >
              <X className="h-4 w-4" aria-label="Clear" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-zinc-500">
            Sort:
          </label>
          <select
            id="sort-select"
            value={sortType}
            onChange={(e) =>
              handleSortTypeChange(e.target.value as AlbumListType)
            }
            disabled={searchResults !== null}
            className="cursor-pointer rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm text-zinc-300 transition-colors focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
            className="flex min-w-30 cursor-pointer items-center justify-between gap-1.5 rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm text-zinc-400 transition-colors hover:border-zinc-700"
            title={sortDirection === "desc" ? "Descending" : "Ascending"}
          >
            {sortDirection === "desc" ? (
              <>
                Descending
                <TrendingDown
                  className="h-3.5 w-3.5"
                  aria-label="Sort descending"
                />
              </>
            ) : (
              <>
                Ascending
                <TrendingUp
                  className="h-3.5 w-3.5"
                  aria-label="Sort ascending"
                />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="cursor-pointer rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-1.75 transition-colors hover:border-zinc-700"
            title="Settings"
          >
            <Settings
              className="h-3.5 w-3.5 text-zinc-400"
              aria-label="Settings"
            />
          </button>
        </div>
      </div>

      {/* Scrollable album grid */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-zinc-500">Loading albums...</div>
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : showSearchLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-zinc-500">Searching...</div>
          </div>
        ) : displayAlbums.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            {searchQuery ? "No results found" : "No albums found"}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayAlbums.map((album) => (
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

      {/* Sticky pagination footer */}
      {searchResults === null && (
        <div className="sticky bottom-0 z-10 flex items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
            className="cursor-pointer rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">
            Page {currentPage + 1}
            {totalPages !== null ? ` of ${totalPages}` : ""}
          </span>
          <button
            type="button"
            onClick={goToNextPage}
            disabled={!hasMore}
            className="cursor-pointer rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
});
