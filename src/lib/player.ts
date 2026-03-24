import { invoke } from "@tauri-apps/api/core";
import { loadDiscordConfig } from "./discord-config";
import { getStoreValue, setStoreValue } from "./store";
import type { Song, SubsonicClient } from "./subsonic";

export interface PlayerState {
  currentTrack: Song | null;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

type PlayerListener = (state: PlayerState) => void;

const VOLUME_STORAGE_KEY = "player-volume";

class AudioPlayer {
  private audio: HTMLAudioElement;
  private client: SubsonicClient | null = null;
  private state: PlayerState = {
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
  };
  private listeners: Set<PlayerListener> = new Set();
  private discordConnected = false;
  private discordEnabled = false;
  private lastTimeUpdate = 0;
  private timeUpdateRafId: number | null = null;

  constructor() {
    this.audio = new Audio();
    this.loadVolume();

    this.audio.addEventListener("timeupdate", () => {
      this.state.currentTime = this.audio.currentTime;
      const now = performance.now();
      if (now - this.lastTimeUpdate >= 250) {
        this.lastTimeUpdate = now;
        if (this.timeUpdateRafId !== null) {
          cancelAnimationFrame(this.timeUpdateRafId);
        }
        this.timeUpdateRafId = requestAnimationFrame(() => {
          this.notify();
          this.timeUpdateRafId = null;
        });
      }
    });

    this.audio.addEventListener("durationchange", () => {
      this.state.duration = this.audio.duration || 0;
      this.notify();
    });

    this.audio.addEventListener("ended", () => {
      this.next();
    });

    this.audio.addEventListener("play", () => {
      this.state.isPlaying = true;
      this.notify();
      this.updateDiscordActivity();
    });

    this.audio.addEventListener("pause", () => {
      this.state.isPlaying = false;
      this.notify();
      this.clearDiscordActivity();
    });

    this.initDiscordFromConfig();
  }

  private async initDiscordFromConfig() {
    const config = await loadDiscordConfig();
    if (config.enabled && config.applicationId) {
      try {
        await this.connectDiscord(config.applicationId);
      } catch (err) {
        console.warn("Failed to connect to Discord on startup:", err);
      }
    }
  }

  async connectDiscord(clientId: string): Promise<void> {
    if (this.discordConnected) {
      await this.disconnectDiscord();
    }
    await invoke("connect_discord", { clientId });
    this.discordConnected = true;
    this.discordEnabled = true;

    if (this.state.isPlaying) {
      this.updateDiscordActivity();
    }
  }

  async disconnectDiscord(): Promise<void> {
    if (this.discordConnected) {
      try {
        await invoke("disconnect_discord");
      } catch (err) {
        console.warn("Failed to disconnect from Discord:", err);
      }
    }
    this.discordConnected = false;
    this.discordEnabled = false;
  }

  private async updateDiscordActivity() {
    if (
      !this.discordConnected ||
      !this.discordEnabled ||
      !this.state.currentTrack
    )
      return;

    try {
      await invoke("update_discord_activity", {
        title: this.state.currentTrack.title,
        artist: this.state.currentTrack.artist,
        album: this.state.currentTrack.album || "",
      });
    } catch (err) {
      console.warn("Failed to update Discord activity:", err);
    }
  }

  private async clearDiscordActivity() {
    if (!this.discordConnected || !this.discordEnabled) return;

    try {
      await invoke("clear_discord_activity");
    } catch (err) {
      console.warn("Failed to clear Discord activity:", err);
    }
  }

  setClient(client: SubsonicClient | null) {
    this.client = client;
    if (!client) {
      this.stop();
    }
  }

  subscribe(listener: PlayerListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  getState(): PlayerState {
    return { ...this.state };
  }

  async playQueue(songs: Song[], startIndex = 0) {
    if (!this.client || songs.length === 0) return;

    this.state.queue = songs;
    this.state.queueIndex = startIndex;
    await this.loadAndPlay(songs[startIndex]);
  }

  private async loadAndPlay(song: Song) {
    if (!this.client) return;

    this.state.currentTrack = song;
    this.notify();

    try {
      const streamUrl = await this.client.getStreamUrl(song.id);
      this.audio.src = streamUrl;
      await this.audio.play();
      this.updateDiscordActivity();
    } catch (err) {
      console.error("Failed to play track:", err);
    }
  }

  async play() {
    if (this.audio.src) {
      await this.audio.play();
    }
  }

  pause() {
    this.audio.pause();
  }

  togglePlayPause() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  async next() {
    if (this.state.queueIndex < this.state.queue.length - 1) {
      this.state.queueIndex++;
      await this.loadAndPlay(this.state.queue[this.state.queueIndex]);
    } else {
      this.stop();
    }
  }

  async previous() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
    } else if (this.state.queueIndex > 0) {
      this.state.queueIndex--;
      await this.loadAndPlay(this.state.queue[this.state.queueIndex]);
    } else {
      this.audio.currentTime = 0;
    }
  }

  seek(time: number) {
    this.audio.currentTime = time;
  }

  setVolume(volume: number) {
    this.state.volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.state.volume;
    this.saveVolume();
    this.notify();
  }

  private async loadVolume() {
    const stored = await getStoreValue<number>(VOLUME_STORAGE_KEY);
    if (stored !== null) {
      this.state.volume = Math.max(0, Math.min(1, stored));
      this.audio.volume = this.state.volume;
      this.notify();
    }
  }

  private async saveVolume() {
    await setStoreValue(VOLUME_STORAGE_KEY, this.state.volume);
  }

  stop() {
    this.audio.pause();
    this.audio.src = "";
    this.state.currentTrack = null;
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    this.state.duration = 0;
    this.notify();
    this.clearDiscordActivity();
  }
}

export const player = new AudioPlayer();
