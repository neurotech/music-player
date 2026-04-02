import { Search } from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CoverArt } from "@/components/CoverArt";
import { formInputClassName } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { ModalHeader } from "@/components/ModalHeader";
import { panelClass } from "@/components/panel-styles";
import { player } from "@/features/player/lib/player";
import { cn } from "@/lib/cn";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import type { SubsonicClient } from "@/lib/subsonic-client";
import { useCoverArtUrls } from "@/lib/useCoverArtUrls";
import { useDebouncedCallback } from "@/lib/useDebouncedCallback";
import type { Album, SearchResult, Song } from "@/types/subsonic";

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
  const inputRef = useRef<HTMLInputElement>(null);
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

  const coverArtEntries = useMemo(
    () =>
      flattenedResults
        .filter((item): item is SearchItem & { coverArt: string } =>
          Boolean(item.coverArt),
        )
        .map((item) => ({
          key: item.coverArt,
          coverArtId: item.coverArt,
        })),
    [flattenedResults],
  );

  const coverUrls = useCoverArtUrls(
    isOpen ? client : null,
    coverArtEntries,
    48,
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
      const outer = requestAnimationFrame(() => {
        requestAnimationFrame(() => inputRef.current?.focus());
      });
      return () => cancelAnimationFrame(outer);
    }
  }, [isOpen]);

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

  const runSearch = useCallback(
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

  const debouncedSearch = useDebouncedCallback(runSearch, SEARCH_DEBOUNCE_MS);

  const handleQueryChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.target.value;
      setQuery(newQuery);

      if (!newQuery.trim()) {
        setResults(null);
        setSelectedIndex(0);
        return;
      }

      debouncedSearch(newQuery);
    },
    [debouncedSearch],
  );

  const handleSelectItem = useCallback(
    async (item: SearchItem) => {
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
    },
    [client, onAlbumClick, onClose],
  );

  const handleModalKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
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
    },
    [flattenedResults, selectedIndex, handleSelectItem],
  );

  const hasResults = flattenedResults.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex animate-fade-in items-start justify-center bg-black/60 pt-[15vh]"
      onKeyDown={handleModalKeyDown}
      aria-labelledby="search-title"
    >
      <div className="mx-4 w-full max-w-lg">
        <div className={panelClass}>
          <ModalHeader
            title="Search"
            titleId="search-title"
            onClose={onClose}
            closeLabel="Close search"
          />

          <div className="p-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder="Search albums and tracks..."
                className={cn(formInputClassName, "py-2 pr-3 pl-8")}
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
                      <CoverArt
                        url={
                          item.coverArt
                            ? (coverUrls[item.coverArt] ?? null)
                            : null
                        }
                        alt=""
                        frame="search"
                      />
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
    </Modal>
  );
}
