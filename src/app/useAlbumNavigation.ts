import { useCallback, useRef } from "react";
import { setSelectedAlbumId as persistSelectedAlbumId } from "@/lib/ui-state";

export function useAlbumNavigation(
  setSelectedAlbumId: (id: string | null) => void,
) {
  const historyStack = useRef<(string | null)[]>([null]);
  const historyIndex = useRef(0);

  const navigateTo = useCallback(
    (albumId: string | null) => {
      historyStack.current = historyStack.current.slice(
        0,
        historyIndex.current + 1,
      );
      historyStack.current.push(albumId);
      historyIndex.current = historyStack.current.length - 1;
      setSelectedAlbumId(albumId);
      persistSelectedAlbumId(albumId);
    },
    [setSelectedAlbumId],
  );

  const navigateBack = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current--;
      const id = historyStack.current[historyIndex.current];
      setSelectedAlbumId(id);
      persistSelectedAlbumId(id);
    }
  }, [setSelectedAlbumId]);

  const navigateForward = useCallback(() => {
    if (historyIndex.current < historyStack.current.length - 1) {
      historyIndex.current++;
      const id = historyStack.current[historyIndex.current];
      setSelectedAlbumId(id);
      persistSelectedAlbumId(id);
    }
  }, [setSelectedAlbumId]);

  const resetHistory = useCallback(() => {
    historyStack.current = [null];
    historyIndex.current = 0;
  }, []);

  const restoreHistoryFromAlbum = useCallback((albumId: string) => {
    historyStack.current = [null, albumId];
    historyIndex.current = 1;
  }, []);

  return {
    navigateTo,
    navigateBack,
    navigateForward,
    resetHistory,
    restoreHistoryFromAlbum,
  };
}
