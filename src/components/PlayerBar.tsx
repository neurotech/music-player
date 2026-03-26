import { Pause, Play, SkipBack, SkipForward, Square, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { type PlayerState, player } from "../lib/player";

function formatTime(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
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
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 py-2 shadow-[0_-1px_rgba(255,255,255,0.05)_inset]">
      <div className="flex items-center gap-4">
        {/* Progress bar */}
        <div className="flex items-center gap-4 flex-1">
          <span className="text-sm text-zinc-500 w-8 text-right">
            {formatTime(state.currentTime)}
          </span>
          <div
            className="flex-1 h-2 bg-zinc-800 rounded-sm cursor-pointer group"
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
              className="h-full bg-indigo-500 rounded-sm relative group-hover:bg-indigo-400 transition-colors"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-sm text-zinc-500 w-8">
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
              className="p-1.5 hover:bg-zinc-800 rounded-sm transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <SkipBack className="w-3.5 h-3.5 text-zinc-400" fill="currentColor" />
            </button>

            <button
              type="button"
              onClick={() => player.togglePlayPause()}
              className="p-2 rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 hover:from-indigo-400/90 hover:to-indigo-800/80 transition-colors shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] cursor-pointer"
              aria-label={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isPlaying ? (
                <Pause className="w-3.5 h-3.5" fill="currentColor" />
              ) : (
                <Play className="w-3.5 h-3.5" fill="currentColor" />
              )}
            </button>

            <button
              type="button"
              onClick={() => player.next()}
              className="p-1.5 hover:bg-zinc-800 rounded-sm transition-colors cursor-pointer"
              aria-label="Next"
            >
              <SkipForward className="w-3.5 h-3.5 text-zinc-400" fill="currentColor" />
            </button>

            <button
              type="button"
              onClick={() => player.stop()}
              className="p-1.5 hover:bg-zinc-800 rounded-sm transition-colors cursor-pointer"
              aria-label="Stop"
            >
              <Square className="w-3.5 h-3.5 text-zinc-400" fill="currentColor" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => player.setVolume(state.volume === 0 ? 1 : 0)}
              className="p-1 hover:bg-zinc-800 rounded-sm transition-colors cursor-pointer"
              aria-label={state.volume === 0 ? "Unmute" : "Mute"}
            >
              {state.volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.volume}
              onChange={(e) => player.setVolume(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-sm appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-zinc-300 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:bg-zinc-100"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
