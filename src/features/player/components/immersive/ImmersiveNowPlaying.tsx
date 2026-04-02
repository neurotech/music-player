import { Radio, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/Button";
import { CoverArt } from "@/components/CoverArt";
import { cn } from "@/lib/cn";
import type { SubsonicClient } from "@/lib/subsonic-client";
import { useCoverArtUrls } from "@/lib/useCoverArtUrls";
import { usePlayerState } from "../../hooks/usePlayerState";
import { ImmersiveVisualizerCanvas } from "./ImmersiveVisualizerCanvas";

const DEFAULT_ACCENT: [number, number, number] = [0.35, 0.28, 0.52];
const COVER_SIZE = 640;

/** Auto-reveal timeline after play/pause or track change (ms). */
const META_FADE_IN_MS = 200;
const META_HOLD_MS = 5000;
const META_FADE_OUT_MS = 10000;
const META_SEQUENCE_MS = META_FADE_IN_MS + META_HOLD_MS + META_FADE_OUT_MS;

interface ImmersiveNowPlayingProps {
  client: SubsonicClient;
  onClose: () => void;
}

function sampleAverageColorFromUrl(
  url: string,
): Promise<[number, number, number]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 32;
        c.height = 32;
        const ctx = c.getContext("2d");
        if (!ctx) {
          resolve(DEFAULT_ACCENT);
          return;
        }
        ctx.drawImage(img, 0, 0, 32, 32);
        const { data } = ctx.getImageData(0, 0, 32, 32);
        let r = 0;
        let g = 0;
        let b = 0;
        const n = (data.length / 4) | 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        resolve([r / n / 255, g / n / 255, b / n / 255]);
      } catch {
        resolve(DEFAULT_ACCENT);
      }
    };
    img.onerror = () => resolve(DEFAULT_ACCENT);
    img.src = url;
  });
}

export function ImmersiveNowPlaying({
  client,
  onClose,
}: ImmersiveNowPlayingProps) {
  const state = usePlayerState();
  const [accent, setAccent] =
    useState<[number, number, number]>(DEFAULT_ACCENT);
  const [overlayHovered, setOverlayHovered] = useState(false);
  const [autoMetaOpacity, setAutoMetaOpacity] = useState(0);
  const metaSeqGen = useRef(0);
  const metaRaf = useRef(0);

  const playbackSignature = `${state.isPlaying ? 1 : 0}:${state.currentTrack?.id ?? ""}:${state.currentRadio?.id ?? ""}`;
  const prevPlaybackSig = useRef<string | null>(null);

  useEffect(() => {
    if (prevPlaybackSig.current === null) {
      prevPlaybackSig.current = playbackSignature;
      return;
    }
    if (prevPlaybackSig.current === playbackSignature) return;
    prevPlaybackSig.current = playbackSignature;

    const gen = ++metaSeqGen.current;
    cancelAnimationFrame(metaRaf.current);
    setAutoMetaOpacity(0);

    const t0 = performance.now();
    function tick(now: number) {
      if (gen !== metaSeqGen.current) return;
      const elapsed = now - t0;
      let opacity = 0;
      if (elapsed < META_FADE_IN_MS) {
        opacity = elapsed / META_FADE_IN_MS;
      } else if (elapsed < META_FADE_IN_MS + META_HOLD_MS) {
        opacity = 1;
      } else if (elapsed < META_SEQUENCE_MS) {
        const u = (elapsed - META_FADE_IN_MS - META_HOLD_MS) / META_FADE_OUT_MS;
        opacity = 1 - u;
      } else {
        opacity = 0;
        setAutoMetaOpacity(0);
        return;
      }
      setAutoMetaOpacity(opacity);
      metaRaf.current = requestAnimationFrame(tick);
    }
    metaRaf.current = requestAnimationFrame(tick);

    return () => {
      if (gen === metaSeqGen.current) {
        cancelAnimationFrame(metaRaf.current);
      }
    };
  }, [playbackSignature]);

  useEffect(
    () => () => {
      metaSeqGen.current += 1;
      cancelAnimationFrame(metaRaf.current);
    },
    [],
  );

  const effectiveMetaOpacity = overlayHovered ? 1 : autoMetaOpacity;
  const metaPointerEvents =
    overlayHovered || autoMetaOpacity > 0.02 ? "auto" : "none";

  const seedKey = state.currentTrack?.id ?? state.currentRadio?.id ?? "idle";

  const coverArtId = state.currentTrack?.coverArt ?? null;
  const coverEntries = useMemo(
    () => (coverArtId ? [{ key: "im", coverArtId }] : []),
    [coverArtId],
  );
  const coverMap = useCoverArtUrls(client, coverEntries, COVER_SIZE);
  const coverUrl = coverArtId ? (coverMap.im ?? null) : null;

  useEffect(() => {
    if (!coverUrl) {
      setAccent(DEFAULT_ACCENT);
      return;
    }
    let cancelled = false;
    void sampleAverageColorFromUrl(coverUrl).then((rgb) => {
      if (!cancelled) setAccent(rgb);
    });
    return () => {
      cancelled = true;
    };
  }, [coverUrl]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const node = (
    <div
      className="fixed inset-0 z-500 flex flex-col bg-black text-zinc-100"
      role="dialog"
      aria-modal="true"
      aria-label="Immersive now playing"
      onMouseEnter={() => setOverlayHovered(true)}
      onMouseLeave={() => setOverlayHovered(false)}
    >
      <div className="absolute inset-0">
        <ImmersiveVisualizerCanvas
          className="h-full w-full"
          seedKey={seedKey}
          accentRgb={accent}
        />
      </div>

      <div
        className="relative z-10 flex flex-1 flex-col justify-center px-8"
        style={{
          opacity: effectiveMetaOpacity,
          pointerEvents: metaPointerEvents,
          transition: overlayHovered ? "opacity 200ms ease-out" : undefined,
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
          {state.currentRadio ? (
            <>
              <div className="flex items-center gap-3 text-indigo-300">
                <Radio className="h-14 w-14 shrink-0 opacity-90" />
                <span className="h-3 w-3 rounded-full bg-red-500" />
              </div>
              <div className="space-y-3">
                <h1 className="text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
                  {state.currentRadio.name}
                </h1>
                <p className="text-lg text-zinc-400">Internet radio · LIVE</p>
              </div>
            </>
          ) : state.currentTrack ? (
            <>
              <CoverArt
                url={coverUrl}
                alt={state.currentTrack.album}
                frame="albumHero"
                className="h-48 w-48 rounded-lg border-zinc-700/50 shadow-2xl sm:h-56 sm:w-56"
                imgClassName="rounded-lg"
                imgProps={coverUrl ? { loading: "eager" } : undefined}
              />
              <div className="space-y-2">
                <h1 className="text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
                  {state.currentTrack.title}
                </h1>
                <p className="text-xl text-zinc-300">
                  {state.currentTrack.artist}
                </p>
                <p className="text-lg text-zinc-500">
                  {state.currentTrack.album}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <h1 className="font-medium text-2xl text-zinc-400">
                Nothing playing
              </h1>
              <p className="text-zinc-500">Start a track or station</p>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute top-4 right-4 z-20">
        <div
          className={cn(
            "transition-opacity duration-200",
            overlayHovered
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          <div className="animate-immersive-breathe">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full border border-zinc-700/60 bg-zinc-950/40 text-zinc-200 backdrop-blur-sm hover:bg-zinc-900/70"
              aria-label="Close immersive view"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
