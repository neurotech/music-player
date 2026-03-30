import { Disc3, Music, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { player } from "../lib/player";
import type {
  Album,
  SearchResult,
  Song,
  SubsonicClient,
} from "../lib/subsonic";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: SubsonicClient;
  onAlbumClick: (albumId: string) => void;
}

interface SearchItem {
  type: "album" | "track";
  id: string;
  title: string;
  subtitle: string;
  coverArt?: string;
  data: Album | Song;
}

export function SearchModal({
  isOpen,
  onClose,
  client,
  onAlbumClick,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const flattenedResults = useMemo(() => {
    const items: SearchItem[] = [];
    if (results?.album) {
      for (const album of results.album) {
        items.push({
          type: "album",
          id: album.id,
          title: album.name,
          subtitle: album.artist,
          coverArt: album.coverArt,
          data: album,
        });
      }
    }
    if (results?.song) {
      for (const song of results.song) {
        items.push({
          type: "track",
          id: song.id,
          title: song.title,
          subtitle: `${song.artist} · ${song.album}`,
          coverArt: song.coverArt,
          data: song,
        });
      }
    }
    return items;
  }, [results]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
      setCoverUrls({});
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;
    async function loadCoverUrls() {
      const coverArtIds = flattenedResults
        .map((item) => item.coverArt)
        .filter((id): id is string => id !== undefined);

      const newUrls: Record<string, string> = {};
      for (const coverArtId of coverArtIds) {
        if (cancelled) return;
        try {
          const url = await client.getCoverArtUrlWithAuth(coverArtId, 48);
          newUrls[coverArtId] = url;
        } catch {
          // Ignore cover art loading errors
        }
      }
      if (!cancelled && Object.keys(newUrls).length > 0) {
        setCoverUrls((prev) => ({ ...prev, ...newUrls }));
      }
    }
    if (flattenedResults.length > 0) {
      loadCoverUrls();
    }
    return () => {
      cancelled = true;
    };
  }, [flattenedResults, client]);

  useEffect(() => {
    if (selectedIndex >= 0 && resultsContainerRef.current) {
      const selectedElement = resultsContainerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults(null);
        setSelectedIndex(0);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = await client.search(searchQuery);
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search failed:", err);
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    },
    [client],
  );

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 300);
  }

  async function handleSelectItem(item: SearchItem) {
    if (item.type === "album") {
      try {
        const albumData = await client.getAlbum(item.id);
        if (albumData.song && albumData.song.length > 0) {
          await player.playQueue(albumData.song, 0);
        }
        onAlbumClick(item.id);
        onClose();
      } catch (err) {
        console.error("Failed to play album:", err);
      }
    } else {
      const song = item.data as Song;
      await player.playQueue([song], 0);
      onAlbumClick(song.albumId);
      onClose();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (flattenedResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < flattenedResults.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedItem = flattenedResults[selectedIndex];
      if (selectedItem) {
        handleSelectItem(selectedItem);
      }
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  if (!isOpen) return null;

  const hasResults = flattenedResults.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-start justify-center bg-black/60 pt-[15vh]"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-title"
    >
      <div className="mx-4 w-full max-w-lg">
        <div className="overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900 shadow-[0_1px_rgba(255,255,255,0.05)_inset]">
          <div className="flex items-center justify-between border-zinc-900 border-b bg-zinc-800/80 px-3 py-2">
            <h2
              id="search-title"
              className="font-semibold text-sm text-zinc-100"
            >
              Search
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-zinc-400 transition-colors hover:text-zinc-200"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder="Search albums and tracks..."
                className="w-full rounded-sm border border-zinc-800 bg-zinc-950 py-2 pr-3 pl-8 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
          </div>

          {hasQuery && (
            <div
              ref={resultsContainerRef}
              className="max-h-80 overflow-y-auto border-zinc-800 border-t"
            >
              {isSearching ? (
                <div className="p-4 text-center text-sm text-zinc-500">
                  Searching...
                </div>
              ) : hasResults ? (
                <div className="py-1">
                  {flattenedResults.map((item, index) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      data-index={index}
                      onClick={() => handleSelectItem(item)}
                      className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors ${
                        index === selectedIndex
                          ? "bg-indigo-600/30"
                          : "hover:bg-zinc-800/50"
                      }`}
                    >
                      {item.coverArt && coverUrls[item.coverArt] ? (
                        <img
                          src={coverUrls[item.coverArt]}
                          alt=""
                          className="h-10 w-10 rounded-sm border border-zinc-800 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-800">
                          {item.type === "album" ? (
                            <Disc3 className="h-5 w-5 text-zinc-600" />
                          ) : (
                            <Music className="h-5 w-5 text-zinc-600" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-zinc-100">
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {item.type === "album" ? "Album" : "Track"} ·{" "}
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-zinc-500">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-2 text-center text-xs text-zinc-600">
          Use{" "}
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">↑</kbd>{" "}
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">↓</kbd>{" "}
          to navigate,{" "}
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">
            Enter
          </kbd>{" "}
          to play
        </p>
      </div>
    </div>
  );
}
