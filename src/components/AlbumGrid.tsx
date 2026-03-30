import { ArrowBigDown, ArrowDownAZ, ChevronDown, ChevronUp, Music, Search, Settings, TrendingDown, TrendingUp, X } from "lucide-react";
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
      className="group cursor-pointer text-left flex flex-col items-start"
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
            <Music className="w-8 h-8" aria-label="No album cover" />
          </div>
        )}
      </div>
      {album.name && album.name !== "[Unknown Album]" ? (
        <>
          <h3 className="font-medium text-sm truncate text-zinc-200 group-hover:text-indigo-400">
            {album.name}
          </h3>
          <p className="text-zinc-500 text-sm truncate">{album.artist}</p>
        </>
      ) : (
        <>
          <h3 className="font-medium text-sm truncate text-zinc-200 group-hover:text-indigo-400">
            {album.artist}
          </h3>
          <p className="text-zinc-800 text-sm truncate">?</p>
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

    while (await client.getAlbumList(sortType, 1, high * PAGE_SIZE).then(r => r.length > 0)) {
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
            .filter((album) => album.coverArt && !newUrls[album.id])
            .map(async (album) => {
              const url = await client.getCoverArtUrlWithAuth(
                album.coverArt!,
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
    <div className="w-full h-full flex flex-col">
      {/* Sticky search/sort header */}
      <div className="sticky top-0 z-10 bg-zinc-950 pb-4 flex flex-wrap justify-between items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search albums, artists, tracks..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-8 pr-8 py-1 text-sm rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" aria-label="Search" />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" aria-label="Clear" />
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
            onChange={(e) => handleSortTypeChange(e.target.value as AlbumListType)}
            disabled={searchResults !== null}
            className="px-2 py-1 text-sm rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="justify-between min-w-30 px-2 py-1 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5 text-sm text-zinc-400"
            title={sortDirection === "desc" ? "Descending" : "Ascending"}
          >
            {sortDirection === "desc" ? (
              <>
              Descending
                <TrendingDown className="w-3.5 h-3.5" aria-label="Sort descending" />
              </>
            ) : (
              <>
                Ascending
                <TrendingUp className="w-3.5 h-3.5" aria-label="Sort ascending" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="px-2 py-1.75 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" aria-label="Settings" />
          </button>
        </div>
      </div>

      {/* Scrollable album grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-zinc-500">Loading albums...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : showSearchLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-zinc-500">Searching...</div>
          </div>
        ) : displayAlbums.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center">
            {searchQuery ? "No results found" : "No albums found"}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
        <div className="sticky bottom-0 z-10  pt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
            className="px-3 py-1.5 text-sm rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">
            Page {currentPage + 1}{totalPages !== null ? ` of ${totalPages}` : ""}
          </span>
          <button
            type="button"
            onClick={goToNextPage}
            disabled={!hasMore}
            className="px-3 py-1.5 text-sm rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
});
