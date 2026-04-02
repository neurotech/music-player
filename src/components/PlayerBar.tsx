import {
  Disc3,
  ListMusic,
  MessageCircle,
  MessageCircleOff,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type PlayerState, player } from "../lib/player";

interface PlayerBarProps {
  onQueueClick?: () => void;
  isQueueOpen?: boolean;
  activeView?: "albums" | "radio";
  onViewChange?: (view: "albums" | "radio") => void;
}

function formatTime(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PlayerBar({
  onQueueClick,
  isQueueOpen,
  activeView = "albums",
  onViewChange,
}: PlayerBarProps) {
  const [state, setState] = useState<PlayerState>(player.getState());
  const [discordEnabled, setDiscordEnabled] = useState(
    player.isDiscordEnabled(),
  );
  const [discordConnected, setDiscordConnected] = useState(
    player.isDiscordConnected(),
  );

  useEffect(() => {
    return player.subscribe((newState) => {
      setState(newState);
      setDiscordEnabled(player.isDiscordEnabled());
      setDiscordConnected(player.isDiscordConnected());
    });
  }, []);

  const handleToggleDiscord = useCallback(() => {
    const newEnabled = !discordEnabled;
    player.setDiscordEnabled(newEnabled);
    setDiscordEnabled(newEnabled);
  }, [discordEnabled]);

  const isRadioPlaying = !!state.currentRadio;
  const hasContent = state.currentTrack || state.currentRadio;

  const progress =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div
      className={`fixed bottom-0 left-0 border-zinc-800 border-t bg-zinc-900 px-4 py-2 shadow-[0_-1px_rgba(255,255,255,0.05)_inset] transition-all duration-300 ${
        isQueueOpen ? "right-80" : "right-0"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* View tabs */}
        <div className="flex items-center gap-1 border-zinc-800 border-r pr-4">
          <button
            type="button"
            onClick={() => onViewChange?.("albums")}
            className={`cursor-pointer rounded-sm p-1.5 transition-colors ${
              activeView === "albums"
                ? "bg-zinc-800 text-indigo-400"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
            aria-label="Albums"
            title="Albums"
          >
            <Disc3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange?.("radio")}
            className={`cursor-pointer rounded-sm p-1.5 transition-colors ${
              activeView === "radio"
                ? "bg-zinc-800 text-indigo-400"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
            aria-label="Radio"
            title="Radio"
          >
            <Radio className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar or Radio indicator */}
        <div className="flex flex-1 items-center gap-4">
          {isRadioPlaying ? (
            <div className="flex flex-1 items-center gap-3">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-indigo-400" />
                <span className="text-sm text-zinc-300">
                  {state.currentRadio?.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                <span className="text-xs text-zinc-500">LIVE</span>
              </div>
            </div>
          ) : hasContent ? (
            <>
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
            </>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        {/* Controls and Volume */}
        <div className="flex items-center gap-4">
          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isRadioPlaying && (
              <button
                type="button"
                onClick={() => player.previous()}
                className="cursor-pointer rounded-sm p-1.5 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Previous"
                disabled={!hasContent}
              >
                <SkipBack
                  className="h-3.5 w-3.5 text-zinc-400"
                  fill="currentColor"
                />
              </button>
            )}

            <button
              type="button"
              onClick={() => player.togglePlayPause()}
              className="cursor-pointer rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 p-2 shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] transition-colors hover:from-indigo-400/90 hover:to-indigo-800/80 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={state.isPlaying ? "Pause" : "Play"}
              disabled={!hasContent}
            >
              {state.isPlaying ? (
                <Pause className="h-3.5 w-3.5" fill="currentColor" />
              ) : (
                <Play className="h-3.5 w-3.5" fill="currentColor" />
              )}
            </button>

            {!isRadioPlaying && (
              <button
                type="button"
                onClick={() => player.next()}
                className="cursor-pointer rounded-sm p-1.5 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Next"
                disabled={!hasContent}
              >
                <SkipForward
                  className="h-3.5 w-3.5 text-zinc-400"
                  fill="currentColor"
                />
              </button>
            )}

            <button
              type="button"
              onClick={() => player.stop()}
              className="cursor-pointer rounded-sm p-1.5 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Stop"
              disabled={!hasContent}
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

          {/* Discord toggle - only show when connected */}
          {discordConnected && (
            <button
              type="button"
              onClick={handleToggleDiscord}
              className={`cursor-pointer rounded-sm p-1.5 transition-colors ${
                discordEnabled
                  ? "text-indigo-400 hover:bg-zinc-800"
                  : "text-zinc-500 hover:bg-zinc-800"
              }`}
              aria-label={
                discordEnabled
                  ? "Disable Discord status"
                  : "Enable Discord status"
              }
              title={
                discordEnabled ? "Discord status: On" : "Discord status: Off"
              }
            >
              {discordEnabled ? (
                <MessageCircle className="h-4 w-4" />
              ) : (
                <MessageCircleOff className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Queue button - only show when not playing radio */}
          {!isRadioPlaying && (
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
          )}
        </div>
      </div>
    </div>
  );
}
