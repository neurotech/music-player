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
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
      onClick={handleBackdropClick}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="w-full max-w-sm mx-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden shadow-[0_1px_rgba(255,255,255,0.05)_inset]">
          <div className="bg-zinc-800/80 px-3 py-2 border-b border-zinc-900 flex items-center justify-between">
            <h2
              id="settings-title"
              className="text-sm font-semibold text-zinc-100"
            >
              Settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">
                Discord Rich Presence
              </h3>

              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={discordEnabled}
                  onChange={(e) => setDiscordEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-sm bg-zinc-950 border border-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-zinc-400">
                  Enable Discord Rich Presence
                </span>
              </label>

              <div>
                <label
                  htmlFor="applicationId"
                  className="block text-sm font-medium text-zinc-400 mb-1"
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
                  className="w-full px-2 py-1.5 text-sm rounded-sm bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-zinc-600">
                  Create an app at{" "}
                  <a
                    href="https://discord.com/developers/applications"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Discord Developer Portal
                  </a>
                </p>
              </div>
            </div>

            {status === "error" && errorMessage && (
              <p className="text-sm text-red-400 bg-red-950/50 border border-red-900/50 px-2 py-1.5 rounded-sm">
                {errorMessage}
              </p>
            )}

            {status === "success" && (
              <p className="text-sm text-green-400 bg-green-950/50 border border-green-900/50 px-2 py-1.5 rounded-sm">
                Settings saved
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-2 py-1.5 text-sm font-semibold rounded-sm border border-zinc-800 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || (discordEnabled && !applicationId.trim())}
                className="flex-1 px-2 py-1.5 text-sm font-semibold rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 hover:from-indigo-400/90 hover:to-indigo-800/80 disabled:bg-zinc-900/70 disabled:from-zinc-800/50 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] cursor-pointer select-none"
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
