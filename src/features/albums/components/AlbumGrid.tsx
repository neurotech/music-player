import {
  LogOut,
  Search,
  Settings,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { CoverArt } from "@/components/CoverArt";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import type { SubsonicClient } from "@/lib/subsonic-client";
import { useCoverArtUrls } from "@/lib/useCoverArtUrls";
import { useDebouncedCallback } from "@/lib/useDebouncedCallback";
import type { Album, AlbumListType } from "@/types/subsonic";

interface AlbumGridProps {
  client: SubsonicClient;
  onAlbumClick: (albumId: string) => void;
  onOpenSettings: () => void;
  onDisconnect: () => void;
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
      <div className="mb-1.5 aspect-square w-full overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900">
        <CoverArt url={coverUrl} alt={album.name} frame="fill" />
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

interface AlbumPaginationProps {
  currentPage: number;
  totalPages: number | null;
  hasMore: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function AlbumPagination({
  currentPage,
  totalPages,
  hasMore,
  onPreviousPage,
  onNextPage,
}: AlbumPaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4 pt-6 pb-2">
      <Button
        variant="secondary"
        onClick={onPreviousPage}
        disabled={currentPage === 0}
        className="border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-900"
      >
        Previous
      </Button>
      <span className="text-sm text-zinc-500">
        Page {currentPage + 1}
        {totalPages !== null ? ` of ${totalPages}` : ""}
      </span>
      <Button
        variant="secondary"
        onClick={onNextPage}
        disabled={!hasMore}
        className="border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-900"
      >
        Next
      </Button>
    </div>
  );
}

export const AlbumGrid = memo(function AlbumGrid({
  client,
  onAlbumClick,
  onOpenSettings,
  onDisconnect,
}: AlbumGridProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState<AlbumListType>("newest");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Album[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const albumCountCacheRef = useRef<Map<AlbumListType, number>>(new Map());
  const albumListRequestIdRef = useRef(0);
  const totalPagesRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);

  // Reset cached page counts when the connected server/client instance changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency on `client` identity
  useEffect(() => {
    albumCountCacheRef.current.clear();
    albumListRequestIdRef.current++;
    totalPagesRequestIdRef.current++;
    searchRequestIdRef.current++;
    setTotalPages(null);
  }, [client]);

  const fetchAlbumCount = useCallback(async (): Promise<number> => {
    const cached = albumCountCacheRef.current.get(sortType);
    if (cached !== undefined) return cached;

    async function hasAlbumAtOffset(offset: number): Promise<boolean> {
      const result = await client.getAlbumList(sortType, 1, offset);
      return result.length > 0;
    }

    let low = 0;
    let high = PAGE_SIZE;

    while (await hasAlbumAtOffset(high)) {
      low = high + 1;
      high *= 2;
    }

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (await hasAlbumAtOffset(mid)) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    albumCountCacheRef.current.set(sortType, low);
    return low;
  }, [client, sortType]);

  const fetchTotalPages = useCallback(async () => {
    const requestId = ++totalPagesRequestIdRef.current;

    try {
      const albumCount = await fetchAlbumCount();
      if (requestId === totalPagesRequestIdRef.current) {
        setTotalPages(Math.max(1, Math.ceil(albumCount / PAGE_SIZE)));
      }
    } catch (err) {
      console.warn("Failed to fetch album count:", err);
      if (requestId === totalPagesRequestIdRef.current) {
        setTotalPages(null);
      }
    }
  }, [fetchAlbumCount]);

  const fetchAlbums = useCallback(async () => {
    const requestId = ++albumListRequestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      let albumList: Album[];
      let nextHasMore: boolean;

      if (sortDirection === "asc") {
        let albumCount: number | null = null;

        try {
          albumCount = await fetchAlbumCount();
        } catch (err) {
          console.warn("Failed to fetch album count for ascending sort:", err);
        }

        if (albumCount !== null) {
          const remaining = albumCount - currentPage * PAGE_SIZE;
          const pageSize = Math.min(PAGE_SIZE, Math.max(0, remaining));
          const offset = Math.max(0, albumCount - (currentPage + 1) * PAGE_SIZE);
          albumList =
            pageSize > 0
              ? await client.getAlbumList(sortType, pageSize, offset)
              : [];
          albumList = [...albumList].reverse();
          nextHasMore = currentPage < Math.ceil(albumCount / PAGE_SIZE) - 1;
        } else {
          const offset = currentPage * PAGE_SIZE;
          albumList = await client.getAlbumList(sortType, PAGE_SIZE, offset);
          albumList = [...albumList].reverse();
          nextHasMore = albumList.length === PAGE_SIZE;
        }
      } else {
        const offset = currentPage * PAGE_SIZE;
        albumList = await client.getAlbumList(sortType, PAGE_SIZE, offset);
        const albumCount = albumCountCacheRef.current.get(sortType);
        nextHasMore =
          albumCount !== undefined
            ? offset + albumList.length < albumCount
            : albumList.length === PAGE_SIZE;
      }

      if (requestId !== albumListRequestIdRef.current) return;

      setHasMore(nextHasMore);
      setAlbums(albumList);
    } catch (err) {
      if (requestId !== albumListRequestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to fetch albums");
    } finally {
      if (requestId === albumListRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [client, sortType, sortDirection, currentPage, fetchAlbumCount]);

  const runSearch = useCallback(
    async (query: string, requestId: number) => {
      if (!query.trim()) {
        if (requestId !== searchRequestIdRef.current) return;
        setSearchResults(null);
        setIsSearching(false);
        return;
      }

      if (requestId !== searchRequestIdRef.current) return;

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
        if (requestId !== searchRequestIdRef.current) return;
        setSearchResults(uniqueAlbums);
      } catch (err) {
        if (requestId !== searchRequestIdRef.current) return;
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setIsSearching(false);
        }
      }
    },
    [client],
  );

  const debouncedSearch = useDebouncedCallback(runSearch, SEARCH_DEBOUNCE_MS);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      const requestId = ++searchRequestIdRef.current;
      setSearchQuery(query);

      if (!query.trim()) {
        setSearchResults(null);
        setIsSearching(false);
        return;
      }

      debouncedSearch(query, requestId);
    },
    [debouncedSearch],
  );

  const clearSearch = useCallback(() => {
    searchRequestIdRef.current++;
    setSearchQuery("");
    setSearchResults(null);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  useEffect(() => {
    fetchTotalPages();
  }, [fetchTotalPages]);

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
  const showSearchLoading = isSearching && Boolean(searchQuery.trim());
  const showPagination =
    searchResults === null && !loading && !error && !showSearchLoading;

  const coverArtEntries = useMemo(
    () =>
      displayAlbums
        .filter((a): a is Album & { coverArt: string } => Boolean(a.coverArt))
        .map((a) => ({ key: a.id, coverArtId: a.coverArt })),
    [displayAlbums],
  );

  const coverUrls = useCoverArtUrls(client, coverArtEntries, 300);

  return (
    <div className="flex h-full w-full flex-col">
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
            <Button
              variant="link"
              size="icon-sm"
              onClick={clearSearch}
              title="Clear search"
              className="absolute top-1/2 right-2 -translate-y-1/2"
            >
              <X className="h-4 w-4" aria-label="Clear" />
            </Button>
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

          <Button
            variant="secondary"
            size="sm"
            onClick={toggleDirection}
            title={sortDirection === "desc" ? "Descending" : "Ascending"}
            className="min-w-30 justify-between border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900"
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
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenSettings}
            title="Settings"
            className="border-zinc-800 bg-zinc-900 px-2 py-1.75 hover:border-zinc-700 hover:bg-zinc-900"
          >
            <Settings
              className="h-3.5 w-3.5 text-zinc-400"
              aria-label="Settings"
            />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onDisconnect}
            title="Disconnect from server"
            className="border-zinc-800 bg-zinc-900 px-2 py-1.75 hover:border-zinc-700 hover:bg-zinc-900"
          >
            <LogOut
              className="h-3.5 w-3.5 text-zinc-400"
              aria-label="Disconnect"
            />
          </Button>
        </div>
      </div>

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

        {showPagination && (
          <AlbumPagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasMore={hasMore}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
          />
        )}
      </div>
    </div>
  );
});
