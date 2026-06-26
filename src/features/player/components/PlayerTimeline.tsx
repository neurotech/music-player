import { Radio } from "lucide-react";
import { type KeyboardEvent, useCallback } from "react";
import { formatDurationSeconds } from "@/lib/format";
import { player } from "../lib/player";
import type { PlayerState } from "../types";

interface PlayerTimelineProps {
  state: PlayerState;
}

const SEEK_STEP_SEC = 5;

export function PlayerTimeline({ state }: PlayerTimelineProps) {
  const isRadioPlaying = Boolean(state.currentRadio);
  const hasContent = Boolean(state.currentTrack || state.currentRadio);
  const progress =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  const handleSeekKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const s = player.getState();
    if (s.currentRadio) return;
    const dur = s.duration;
    if (!(s.currentTrack && dur > 0)) return;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const next = Math.max(0, s.currentTime - SEEK_STEP_SEC);
      player.seek(next);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = Math.min(dur, s.currentTime + SEEK_STEP_SEC);
      player.seek(next);
    } else if (e.key === "Home") {
      e.preventDefault();
      player.seek(0);
    } else if (e.key === "End") {
      e.preventDefault();
      player.seek(dur);
    }
  }, []);

  if (!hasContent) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 border-zinc-800 border-b px-3 py-2">
      {isRadioPlaying ? (
        <div className="flex flex-1 items-center justify-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Radio className="h-4 w-4 shrink-0 text-indigo-400" />
            <span className="truncate text-sm text-zinc-300">
              {state.currentRadio?.name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs text-zinc-500">LIVE</span>
          </div>
        </div>
      ) : (
        <>
          <span className="w-10 text-sm text-zinc-500">
            {formatDurationSeconds(state.currentTime)}
          </span>
          <div
            className="group h-2 flex-1 cursor-pointer rounded-sm bg-zinc-800"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              player.seek(percent * state.duration);
            }}
            onKeyDown={handleSeekKeyDown}
            role="slider"
            aria-label="Seek"
            aria-valuenow={Math.round(state.currentTime)}
            aria-valuemin={0}
            aria-valuemax={Math.round(state.duration)}
            tabIndex={0}
          >
            <div
              className="relative h-full rounded-sm bg-indigo-500 transition-colors group-hover:bg-indigo-400"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute top-1/2 right-0 h-2 w-2 -translate-y-1/2 rounded-full bg-zinc-100 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
          <span className="w-10 text-right text-sm text-zinc-500">
            {formatDurationSeconds(state.duration)}
          </span>
        </>
      )}
    </div>
  );
}
