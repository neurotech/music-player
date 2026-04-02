import { useEffect, useMemo, useRef, useState } from "react";

import type { SubsonicClient } from "@/lib/subsonic-client";

export interface CoverArtUrlEntry {
  /** Key in the returned map (e.g. album id or coverArt id). */
  key: string;
  coverArtId: string;
}

/**
 * Resolves authenticated cover art URLs for the given entries. Fetches each
 * unique `coverArtId` once; cancelled on unmount or when inputs change.
 */
export function useCoverArtUrls(
  client: SubsonicClient | null,
  entries: readonly CoverArtUrlEntry[],
  size: number,
): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const signature = useMemo(() => {
    if (entries.length === 0) return "";
    return entries
      .map((e) => `${e.key}:${e.coverArtId}`)
      .sort()
      .join("|");
  }, [entries]);

  useEffect(() => {
    if (!client || !signature) {
      setUrls({});
      return;
    }

    const snapshot = entriesRef.current;
    if (snapshot.length === 0) {
      setUrls({});
      return;
    }

    const subsonic = client;
    let cancelled = false;
    const uniqueCoverIds = [...new Set(snapshot.map((e) => e.coverArtId))];

    async function run() {
      const resolved = await Promise.all(
        uniqueCoverIds.map(async (coverArtId) => {
          try {
            const url = await subsonic.getCoverArtUrlWithAuth(coverArtId, size);
            return [coverArtId, url] as const;
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;
      const idToUrl: Record<string, string> = {};
      for (const row of resolved) {
        if (row) idToUrl[row[0]] = row[1];
      }
      const next: Record<string, string> = {};
      for (const e of snapshot) {
        const u = idToUrl[e.coverArtId];
        if (u) next[e.key] = u;
      }
      setUrls(next);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [client, size, signature]);

  return urls;
}
