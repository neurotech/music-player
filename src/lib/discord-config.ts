import { getStoreValue, setStoreValue } from "./store";

export interface DiscordConfig {
  enabled: boolean;
  applicationId: string;
  statusEnabled: boolean;
}

const STORAGE_KEY = "discord-config";

const DEFAULT_CONFIG: DiscordConfig = {
  enabled: false,
  applicationId: "",
  statusEnabled: true,
};

export async function saveDiscordConfig(config: DiscordConfig): Promise<void> {
  await setStoreValue(STORAGE_KEY, config);
}

export async function loadDiscordConfig(): Promise<DiscordConfig> {
  const stored = await getStoreValue<Partial<DiscordConfig>>(STORAGE_KEY);
  if (!stored) return DEFAULT_CONFIG;
  return {
    enabled: stored.enabled ?? DEFAULT_CONFIG.enabled,
    applicationId: stored.applicationId ?? DEFAULT_CONFIG.applicationId,
    statusEnabled: stored.statusEnabled ?? DEFAULT_CONFIG.statusEnabled,
  };
}
