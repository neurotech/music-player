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
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { type KeyboardEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { formatDurationSeconds } from "@/lib/format";
import { usePlayerState } from "../hooks/usePlayerState";
import { player } from "../lib/player";

interface PlayerBarProps {
  onQueueClick?: () => void;
  isQueueOpen?: boolean;
  activeView?: "albums" | "radio";
  onViewChange?: (view: "albums" | "radio") => void;
  isImmersiveOpen?: boolean;
  onImmersiveToggle?: () => void;
}

const SEEK_STEP_SEC = 5;

export function PlayerBar({
  onQueueClick,
  isQueueOpen,
  activeView = "albums",
  onViewChange,
  isImmersiveOpen,
  onImmersiveToggle,
}: PlayerBarProps) {
  const state = usePlayerState();
  const [discordEnabled, setDiscordEnabled] = useState(() =>
    player.isDiscordEnabled(),
  );
  const [discordConnected, setDiscordConnected] = useState(() =>
    player.isDiscordConnected(),
  );

  useEffect(() => {
    return player.subscribe(() => {
      setDiscordEnabled(player.isDiscordEnabled());
      setDiscordConnected(player.isDiscordConnected());
    });
  }, []);

  const handleToggleDiscord = useCallback(() => {
    const newEnabled = !discordEnabled;
    player.setDiscordEnabled(newEnabled);
    setDiscordEnabled(newEnabled);
  }, [discordEnabled]);

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

  const isRadioPlaying = !!state.currentRadio;
  const hasContent = Boolean(state.currentTrack || state.currentRadio);

  const progress =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div
      className={`fixed bottom-0 left-0 border-zinc-800 border-t bg-zinc-900 px-4 py-2 shadow-[0_-1px_rgba(255,255,255,0.05)_inset] transition-all duration-300 ${
        isQueueOpen ? "right-80" : "right-0"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 border-zinc-800 border-r pr-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange?.("albums")}
            className={
              activeView === "albums"
                ? "bg-zinc-800 text-indigo-400"
                : "text-zinc-500"
            }
            aria-label="Albums"
            title="Albums"
          >
            <Disc3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange?.("radio")}
            className={
              activeView === "radio"
                ? "bg-zinc-800 text-indigo-400"
                : "text-zinc-500"
            }
            aria-label="Radio"
            title="Radio"
          >
            <Radio className="h-4 w-4" />
          </Button>
        </div>

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
              <span className="w-8 text-sm text-zinc-500">
                {formatDurationSeconds(state.duration)}
              </span>
            </>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {!isRadioPlaying && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => player.previous()}
                aria-label="Previous"
                disabled={!hasContent}
              >
                <SkipBack
                  className="h-3.5 w-3.5 text-zinc-400"
                  fill="currentColor"
                />
              </Button>
            )}

            <Button
              size="icon"
              onClick={() => player.togglePlayPause()}
              aria-label={state.isPlaying ? "Pause" : "Play"}
              disabled={!hasContent}
              className="p-2"
            >
              {state.isPlaying ? (
                <Pause className="h-3.5 w-3.5" fill="currentColor" />
              ) : (
                <Play className="h-3.5 w-3.5" fill="currentColor" />
              )}
            </Button>

            {!isRadioPlaying && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => player.next()}
                aria-label="Next"
                disabled={!hasContent}
              >
                <SkipForward
                  className="h-3.5 w-3.5 text-zinc-400"
                  fill="currentColor"
                />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => player.stop()}
              aria-label="Stop"
              disabled={!hasContent}
            >
              <Square
                className="h-3.5 w-3.5 text-zinc-400"
                fill="currentColor"
              />
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => player.setVolume(state.volume === 0 ? 1 : 0)}
              aria-label={state.volume === 0 ? "Unmute" : "Mute"}
            >
              {state.volume === 0 ? (
                <VolumeX className="h-3.5 w-3.5 text-zinc-500" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-zinc-500" />
              )}
            </Button>
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

          {discordConnected && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleDiscord}
              className={discordEnabled ? "text-indigo-400" : "text-zinc-500"}
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
            </Button>
          )}

          {onImmersiveToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onImmersiveToggle}
              className={
                isImmersiveOpen
                  ? "bg-indigo-600 text-white hover:bg-indigo-600"
                  : "text-zinc-400"
              }
              aria-label="Immersive now playing"
              title="Immersive now playing (global shortcut: OS prefix + backslash)"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          )}

          {!isRadioPlaying && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onQueueClick}
              className={
                isQueueOpen
                  ? "bg-indigo-600 text-white hover:bg-indigo-600"
                  : "text-zinc-400"
              }
              aria-label="Queue"
            >
              <ListMusic className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
