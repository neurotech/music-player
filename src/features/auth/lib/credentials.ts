import { getStoreValue, removeStoreValue, setStoreValue } from "@/lib/store";
import type { SubsonicCredentials } from "@/types/subsonic";

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
