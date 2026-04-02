import { SubsonicClient } from "@/lib/subsonic-client";
import type { SubsonicCredentials } from "@/types/subsonic";

export type ConnectSubsonicResult =
  | { ok: true; client: SubsonicClient }
  | { ok: false; error: string };

export async function connectSubsonicClient(
  credentials: SubsonicCredentials,
): Promise<ConnectSubsonicResult> {
  try {
    const client = new SubsonicClient(credentials);
    const success = await client.ping();
    if (!success) {
      return { ok: false, error: "Failed to connect. Check your credentials." };
    }
    return { ok: true, client };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Failed to connect to server",
    };
  }
}
