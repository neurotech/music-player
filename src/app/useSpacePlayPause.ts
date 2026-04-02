import { useEffect } from "react";
import { player } from "@/features/player/lib/player";

export function useSpacePlayPause() {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space") return;

      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputField) return;

      event.preventDefault();
      player.togglePlayPause();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
