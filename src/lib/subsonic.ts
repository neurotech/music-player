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

interface AlbumListResponse {
  albumList2: {
    album: Album[];
  };
}

interface AlbumResponse {
  album: AlbumWithSongs;
}

interface PingResponse {
  version: string;
}

function generateSalt(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let salt = "";
  for (let i = 0; i < length; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

async function md5(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("MD5", msgBuffer).catch(() => {
    // MD5 not available in crypto.subtle, use fallback
    return null;
  });

  if (hashBuffer) {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback: simple MD5 implementation
  return md5Fallback(message);
}

function md5Fallback(string: string): string {
  function rotateLeft(value: number, shift: number) {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number) {
    const result = (x & 0x7fffffff) + (y & 0x7fffffff);
    if (x & 0x80000000 && y & 0x80000000) {
      return result ^ 0x80000000 ^ 0x80000000;
    }
    if (x & 0x80000000 || y & 0x80000000) {
      if (result & 0x80000000) {
        return result ^ 0x80000000;
      }
      return result | 0x80000000;
    }
    return result;
  }

  function f(x: number, y: number, z: number) {
    return (x & y) | (~x & z);
  }
  function g(x: number, y: number, z: number) {
    return (x & z) | (y & ~z);
  }
  function h(x: number, y: number, z: number) {
    return x ^ y ^ z;
  }
  function i(x: number, y: number, z: number) {
    return y ^ (x | ~z);
  }

  function ff(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number,
  ) {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function gg(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number,
  ) {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function hh(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number,
  ) {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function ii(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number,
  ) {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string) {
    const wordCount = ((str.length + 8) >> 6) + 1;
    const wordArray = new Array(wordCount * 16).fill(0);
    let bytePos = 0;
    let byteCount = 0;
    while (byteCount < str.length) {
      const wordPos = (byteCount - (byteCount % 4)) / 4;
      bytePos = (byteCount % 4) * 8;
      wordArray[wordPos] |= str.charCodeAt(byteCount) << bytePos;
      byteCount++;
    }
    const wordPos = (byteCount - (byteCount % 4)) / 4;
    bytePos = (byteCount % 4) * 8;
    wordArray[wordPos] |= 0x80 << bytePos;
    wordArray[wordCount * 16 - 2] = str.length * 8;
    return wordArray;
  }

  function wordToHex(value: number) {
    let hex = "";
    for (let i = 0; i <= 3; i++) {
      const byte = (value >> (i * 8)) & 255;
      hex += byte.toString(16).padStart(2, "0");
    }
    return hex;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22;
  const S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20;
  const S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23;
  const S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a,
      BB = b,
      CC = c,
      DD = d;

    a = ff(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = ff(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15], S14, 0x49b40821);

    a = gg(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = gg(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10], S22, 0x02441453);
    c = gg(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);

    a = hh(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = hh(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6], S34, 0x04881d05);
    a = hh(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2], S34, 0xc4ac5665);

    a = ii(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 9], S44, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}

export class SubsonicClient {
  private credentials: SubsonicCredentials;
  private clientName = "MusicPlayer";
  private apiVersion = "1.16.1";

  constructor(credentials: SubsonicCredentials) {
    this.credentials = credentials;
  }

  private async buildAuthParams(): Promise<URLSearchParams> {
    const salt = generateSalt();
    const token = await md5(this.credentials.password + salt);

    return new URLSearchParams({
      u: this.credentials.username,
      t: token,
      s: salt,
      v: this.apiVersion,
      c: this.clientName,
      f: "json",
    });
  }

  private async request<T>(
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const authParams = await this.buildAuthParams();
    Object.entries(params).forEach(([key, value]) => {
      authParams.set(key, value);
    });

    const baseUrl = this.credentials.serverUrl.replace(/\/$/, "");
    const url = `${baseUrl}/rest/${endpoint}?${authParams.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = (await response.json()) as SubsonicResponse<T>;

    if (data["subsonic-response"].status === "failed") {
      const error = data["subsonic-response"].error;
      throw new Error(error?.message || "Unknown Subsonic error");
    }

    return data["subsonic-response"] as T;
  }

  async ping(): Promise<boolean> {
    try {
      await this.request<PingResponse>("ping");
      return true;
    } catch {
      return false;
    }
  }

  async getAlbumList(
    type: AlbumListType = "alphabeticalByName",
    size = 50,
    offset = 0,
  ): Promise<Album[]> {
    const response = await this.request<AlbumListResponse>("getAlbumList2", {
      type,
      size: size.toString(),
      offset: offset.toString(),
    });

    return response.albumList2?.album || [];
  }

  async getCoverArtUrlWithAuth(
    coverArtId: string,
    size = 300,
  ): Promise<string> {
    const authParams = await this.buildAuthParams();
    authParams.set("id", coverArtId);
    authParams.set("size", size.toString());

    const baseUrl = this.credentials.serverUrl.replace(/\/$/, "");
    return `${baseUrl}/rest/getCoverArt?${authParams.toString()}`;
  }

  async getAlbum(id: string): Promise<AlbumWithSongs> {
    const response = await this.request<AlbumResponse>("getAlbum", { id });
    return response.album;
  }

  async getStreamUrl(songId: string): Promise<string> {
    const authParams = await this.buildAuthParams();
    authParams.set("id", songId);

    const baseUrl = this.credentials.serverUrl.replace(/\/$/, "");
    return `${baseUrl}/rest/stream?${authParams.toString()}`;
  }
}

import { getStoreValue, removeStoreValue, setStoreValue } from "./store";

const STORAGE_KEY = "navidrome-credentials";

export async function saveCredentials(
  credentials: SubsonicCredentials,
): Promise<void> {
  await setStoreValue(STORAGE_KEY, credentials);
}

export async function loadCredentials(): Promise<SubsonicCredentials | null> {
  return await getStoreValue<SubsonicCredentials>(STORAGE_KEY);
}

export async function clearCredentials(): Promise<void> {
  await removeStoreValue(STORAGE_KEY);
}
