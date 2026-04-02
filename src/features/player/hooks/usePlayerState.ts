import { useEffect, useState } from "react";
import { player } from "@/features/player/lib/player";
import type { PlayerState } from "@/features/player/types";

export function usePlayerState(): PlayerState {
  const [state, setState] = useState<PlayerState>(() => player.getState());

  useEffect(() => player.subscribe(setState), []);

  return state;
}
