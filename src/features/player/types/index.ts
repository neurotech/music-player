import type { InternetRadioStation, Song } from "@/types/subsonic";

export interface PlayerState {
  currentTrack: Song | null;
  currentRadio: InternetRadioStation | null;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export interface PersistedPlayerState {
  currentTrack: Song | null;
  queue: Song[];
  queueIndex: number;
  currentTime: number;
}

export type PlayerListener = (state: PlayerState) => void;
export type TrackChangeListener = (track: Song) => void;
