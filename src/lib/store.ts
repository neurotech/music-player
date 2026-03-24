import { load, type Store } from "@tauri-apps/plugin-store";

const STORE_FILE = "config.json";

let storeInstance: Store | null = null;

async function getStore(): Promise<Store> {
  if (!storeInstance) {
    storeInstance = await load(STORE_FILE, { autoSave: true, defaults: {} });
  }
  return storeInstance;
}

export async function getStoreValue<T>(key: string): Promise<T | null> {
  const store = await getStore();
  const value = await store.get<T>(key);
  return value ?? null;
}

export async function setStoreValue<T>(key: string, value: T): Promise<void> {
  const store = await getStore();
  await store.set(key, value);
}

export async function removeStoreValue(key: string): Promise<void> {
  const store = await getStore();
  await store.delete(key);
}
