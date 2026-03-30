import { getCurrentWindow } from "@tauri-apps/api/window";
import { getStoreValue, setStoreValue } from "./store";

const UI_STATE_KEY = "ui-state";

interface PersistedUIState {
  selectedAlbumId: string | null;
}

let currentState: PersistedUIState = {
  selectedAlbumId: null,
};

export async function loadUIState(): Promise<PersistedUIState> {
  const persisted = await getStoreValue<PersistedUIState>(UI_STATE_KEY);
  if (persisted) {
    currentState = persisted;
  }
  return currentState;
}

export async function saveUIState(): Promise<void> {
  await setStoreValue(UI_STATE_KEY, currentState);
}

export function setSelectedAlbumId(albumId: string | null): void {
  currentState.selectedAlbumId = albumId;
  saveUIState();
}

export function getSelectedAlbumId(): string | null {
  return currentState.selectedAlbumId;
}

getCurrentWindow().onCloseRequested(async () => {
  await saveUIState();
});
