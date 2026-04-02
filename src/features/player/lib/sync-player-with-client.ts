import type { SubsonicClient } from "@/lib/subsonic-client";

import { player } from "./player";

export async function syncPlayerWithClient(
  client: SubsonicClient,
): Promise<void> {
  player.setClient(client);
  await player.restorePlayback();
}
