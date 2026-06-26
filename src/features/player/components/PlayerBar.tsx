import type { SubsonicClient } from "@/lib/subsonic-client";
import { usePlayerState } from "../hooks/usePlayerState";
import { NowPlayingHeader } from "./NowPlayingHeader";
import { PlayerControls } from "./PlayerControls";
import { PlayerTimeline } from "./PlayerTimeline";

interface PlayerBarProps {
  client: SubsonicClient;
  onQueueClick?: () => void;
  isQueueOpen?: boolean;
  activeView?: "albums" | "radio";
  onViewChange?: (view: "albums" | "radio") => void;
  isImmersiveOpen?: boolean;
  onImmersiveToggle?: () => void;
  onAlbumClick?: (albumId: string) => void;
}

export function PlayerBar({
  client,
  onQueueClick,
  isQueueOpen,
  activeView = "albums",
  onViewChange,
  isImmersiveOpen,
  onImmersiveToggle,
  onAlbumClick,
}: PlayerBarProps) {
  const state = usePlayerState();
  const hasContent = Boolean(state.currentTrack || state.currentRadio);

  return (
    <div className="shrink-0 border-zinc-800 border-t bg-zinc-900 shadow-[0_-1px_rgba(255,255,255,0.05)_inset]">
      <div className="flex flex-col">
        {state.currentTrack && (
          <NowPlayingHeader client={client} onAlbumClick={onAlbumClick} />
        )}

        {hasContent && <PlayerTimeline state={state} />}

        <PlayerControls
          state={state}
          onQueueClick={onQueueClick}
          isQueueOpen={isQueueOpen}
          activeView={activeView}
          onViewChange={onViewChange}
          isImmersiveOpen={isImmersiveOpen}
          onImmersiveToggle={onImmersiveToggle}
        />
      </div>
    </div>
  );
}
