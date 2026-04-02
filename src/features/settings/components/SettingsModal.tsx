import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { InlineAlert } from "@/components/InlineAlert";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { ModalHeader } from "@/components/ModalHeader";
import { panelClass } from "@/components/panel-styles";
import { player } from "@/features/player/lib/player";
import {
  type DiscordConfig,
  loadDiscordConfig,
  saveDiscordConfig,
} from "../lib/discord-config";

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

  async function handleSave() {
    setIsSaving(true);
    setStatus("idle");
    setErrorMessage("");

    const existingConfig = await loadDiscordConfig();
    const config: DiscordConfig = {
      enabled: discordEnabled,
      applicationId: applicationId.trim(),
      statusEnabled: existingConfig.statusEnabled,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60"
      aria-labelledby="settings-title"
    >
      <div className="mx-4 w-full max-w-sm">
        <div className={panelClass}>
          <ModalHeader
            title="Settings"
            titleId="settings-title"
            onClose={onClose}
            closeLabel="Close settings"
          />

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
                <Input
                  id="applicationId"
                  type="text"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder="Enter your Discord Application ID"
                  disabled={!discordEnabled}
                  className="disabled:cursor-not-allowed disabled:opacity-50"
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
              <InlineAlert variant="error">{errorMessage}</InlineAlert>
            )}

            {status === "success" && (
              <InlineAlert variant="success">Settings saved</InlineAlert>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || (discordEnabled && !applicationId.trim())}
                className="flex-1"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
