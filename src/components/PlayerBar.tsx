import {
  ListMusic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { type PlayerState, player } from "../lib/player";

interface PlayerBarProps {
  onQueueClick?: () => void;
  isQueueOpen?: boolean;
}

function formatTime(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PlayerBar({ onQueueClick, isQueueOpen }: PlayerBarProps) {
  const [state, setState] = useState<PlayerState>(player.getState());

  useEffect(() => {
    return player.subscribe(setState);
  }, []);

  if (!state.currentTrack) {
    return null;
  }

  const progress =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div
      className={`fixed bottom-0 left-0 border-zinc-800 border-t bg-zinc-900 px-4 py-2 shadow-[0_-1px_rgba(255,255,255,0.05)_inset] transition-all duration-300 ${
        isQueueOpen ? "right-80" : "right-0"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Progress bar */}
        <div className="flex flex-1 items-center gap-4">
          <span className="w-8 text-right text-sm text-zinc-500">
            {formatTime(state.currentTime)}
          </span>
          <div
            className="group h-2 flex-1 cursor-pointer rounded-sm bg-zinc-800"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              player.seek(percent * state.duration);
            }}
            onKeyDown={() => {}}
            role="slider"
            aria-label="Seek"
            aria-valuenow={state.currentTime}
            aria-valuemin={0}
            aria-valuemax={state.duration}
            tabIndex={0}
          >
            <div
              className="relative h-full rounded-sm bg-indigo-500 transition-colors group-hover:bg-indigo-400"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute top-1/2 right-0 h-2 w-2 -translate-y-1/2 rounded-full bg-zinc-100 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
          <span className="w-8 text-sm text-zinc-500">
            {formatTime(state.duration)}
          </span>
        </div>

        {/* Controls and Volume */}
        <div className="flex items-center gap-4">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => player.previous()}
              className="cursor-pointer rounded-sm p-1.5 transition-colors hover:bg-zinc-800"
              aria-label="Previous"
            >
              <SkipBack
                className="h-3.5 w-3.5 text-zinc-400"
                fill="currentColor"
              />
            </button>

            <button
              type="button"
              onClick={() => player.togglePlayPause()}
              className="cursor-pointer rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 p-2 shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] transition-colors hover:from-indigo-400/90 hover:to-indigo-800/80"
              aria-label={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isPlaying ? (
                <Pause className="h-3.5 w-3.5" fill="currentColor" />
              ) : (
                <Play className="h-3.5 w-3.5" fill="currentColor" />
              )}
            </button>

            <button
              type="button"
              onClick={() => player.next()}
              className="cursor-pointer rounded-sm p-1.5 transition-colors hover:bg-zinc-800"
              aria-label="Next"
            >
              <SkipForward
                className="h-3.5 w-3.5 text-zinc-400"
                fill="currentColor"
              />
            </button>

            <button
              type="button"
              onClick={() => player.stop()}
              className="cursor-pointer rounded-sm p-1.5 transition-colors hover:bg-zinc-800"
              aria-label="Stop"
            >
              <Square
                className="h-3.5 w-3.5 text-zinc-400"
                fill="currentColor"
              />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => player.setVolume(state.volume === 0 ? 1 : 0)}
              className="cursor-pointer rounded-sm p-1 transition-colors hover:bg-zinc-800"
              aria-label={state.volume === 0 ? "Unmute" : "Mute"}
            >
              {state.volume === 0 ? (
                <VolumeX className="h-3.5 w-3.5 text-zinc-500" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-zinc-500" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.volume}
              onChange={(e) => player.setVolume(Number(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-sm bg-zinc-800 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-300 [&::-webkit-slider-thumb]:hover:bg-zinc-100"
              aria-label="Volume"
            />
          </div>

          {/* Queue button */}
          <button
            type="button"
            onClick={onQueueClick}
            className={`cursor-pointer rounded-sm p-1.5 transition-colors ${
              isQueueOpen
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800"
            }`}
            aria-label="Queue"
          >
            <ListMusic className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
