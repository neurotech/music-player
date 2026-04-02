export interface SubsonicCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  artistId?: string;
  coverArt?: string;
  songCount: number;
  duration: number;
  year?: number;
  genre?: string;
  playCount?: number;
  created?: string;
  played?: string;
}

export type AlbumListType =
  | "random"
  | "newest"
  | "frequent"
  | "recent"
  | "starred"
  | "alphabeticalByName"
  | "alphabeticalByArtist";

export interface SortOption {
  type: AlbumListType;
  label: string;
  supportsDirection: boolean;
}

export interface SubsonicResponse<T> {
  "subsonic-response": {
    status: "ok" | "failed";
    version: string;
    error?: { code: number; message: string };
  } & T;
}

export interface Song {
  id: string;
  title: string;
  album: string;
  albumId: string;
  artist: string;
  artistId?: string;
  track?: number;
  year?: number;
  genre?: string;
  coverArt?: string;
  duration: number;
  bitRate?: number;
  suffix?: string;
  contentType?: string;
  path?: string;
}

export interface AlbumWithSongs extends Album {
  song: Song[];
}

export interface SearchResult {
  artist?: { id: string; name: string }[];
  album?: Album[];
  song?: Song[];
}

export interface InternetRadioStation {
  id: string;
  name: string;
  streamUrl: string;
  homePageUrl?: string;
}
