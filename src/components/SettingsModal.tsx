import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type DiscordConfig,
  loadDiscordConfig,
  saveDiscordConfig,
} from "../lib/discord-config";
import { player } from "../lib/player";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadDiscordConfig().then((config) => {
        setDiscordEnabled(config.enabled);
        setApplicationId(config.applicationId);
        setStatus("idle");
        setErrorMessage("");
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSave() {
    setIsSaving(true);
    setStatus("idle");
    setErrorMessage("");

    const config: DiscordConfig = {
      enabled: discordEnabled,
      applicationId: applicationId.trim(),
    };

    try {
      await saveDiscordConfig(config);

      if (config.enabled && config.applicationId) {
        await player.connectDiscord(config.applicationId);
      } else {
        await player.disconnectDiscord();
      }

      setStatus("success");
      setTimeout(() => onClose(), 500);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setIsSaving(false);
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60"
      onClick={handleBackdropClick}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="mx-4 w-full max-w-sm">
        <div className="overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900 shadow-[0_1px_rgba(255,255,255,0.05)_inset]">
          <div className="flex items-center justify-between border-zinc-900 border-b bg-zinc-800/80 px-3 py-2">
            <h2
              id="settings-title"
              className="font-semibold text-sm text-zinc-100"
            >
              Settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-zinc-400 transition-colors hover:text-zinc-200"
              aria-label="Close settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 p-3">
            <div>
              <h3 className="mb-2 font-semibold text-sm text-zinc-300">
                Discord Rich Presence
              </h3>

              <label className="mb-3 flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={discordEnabled}
                  onChange={(e) => setDiscordEnabled(e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded-sm border border-zinc-700 bg-zinc-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <span className="text-sm text-zinc-400">
                  Enable Discord Rich Presence
                </span>
              </label>

              <div>
                <label
                  htmlFor="applicationId"
                  className="mb-1 block font-medium text-sm text-zinc-400"
                >
                  Application ID
                </label>
                <input
                  id="applicationId"
                  type="text"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder="Enter your Discord Application ID"
                  disabled={!discordEnabled}
                  className="w-full rounded-sm border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="mt-1 text-sm text-zinc-600">
                  Create an app at{" "}
                  <a
                    href="https://discord.com/developers/applications"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 underline hover:text-indigo-300"
                  >
                    Discord Developer Portal
                  </a>
                </p>
              </div>
            </div>

            {status === "error" && errorMessage && (
              <p className="rounded-sm border border-red-900/50 bg-red-950/50 px-2 py-1.5 text-red-400 text-sm">
                {errorMessage}
              </p>
            )}

            {status === "success" && (
              <p className="rounded-sm border border-green-900/50 bg-green-950/50 px-2 py-1.5 text-green-400 text-sm">
                Settings saved
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 cursor-pointer select-none rounded-sm border border-zinc-800 bg-zinc-800 px-2 py-1.5 font-semibold text-sm transition-colors hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || (discordEnabled && !applicationId.trim())}
                className="flex-1 cursor-pointer select-none rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 px-2 py-1.5 font-semibold text-sm shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] transition-colors hover:from-indigo-400/90 hover:to-indigo-800/80 disabled:cursor-not-allowed disabled:bg-zinc-900/70 disabled:from-zinc-800/50 disabled:to-zinc-800 disabled:text-zinc-500"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
