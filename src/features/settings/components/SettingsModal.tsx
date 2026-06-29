import { Database, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { InlineAlert } from "@/components/InlineAlert";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { ModalHeader } from "@/components/ModalHeader";
import { panelClass } from "@/components/panel-styles";
import { player } from "@/features/player/lib/player";
import type { SubsonicClient } from "@/lib/subsonic-client";
import {
  type DiscordConfig,
  loadDiscordConfig,
  saveDiscordConfig,
} from "../lib/discord-config";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: SubsonicClient;
}

type LibraryRefreshType = "quick" | "full";
type LibraryRefreshStatus = "idle" | "running" | "success" | "error";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatLibraryRefreshMessage(
  type: LibraryRefreshType,
  state: "running" | "success",
  count?: number,
) {
  const label =
    type === "full" ? "Full library refresh" : "Quick library refresh";
  const countText =
    count === undefined ? "" : ` (${count} item${count === 1 ? "" : "s"})`;
  return state === "running"
    ? `${label} is running${countText}`
    : `${label} completed${countText}`;
}

export function SettingsModal({ isOpen, onClose, client }: SettingsModalProps) {
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshingLibrary, setRefreshingLibrary] =
    useState<LibraryRefreshType | null>(null);
  const [libraryRefreshStatus, setLibraryRefreshStatus] =
    useState<LibraryRefreshStatus>("idle");
  const [libraryRefreshMessage, setLibraryRefreshMessage] = useState("");
  const libraryRefreshRunIdRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      loadDiscordConfig().then((config) => {
        setDiscordEnabled(config.enabled);
        setApplicationId(config.applicationId);
        setStatus("idle");
        setErrorMessage("");
        setLibraryRefreshStatus("idle");
        setLibraryRefreshMessage("");
        setRefreshingLibrary(null);
      });
    } else {
      libraryRefreshRunIdRef.current += 1;
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

  async function handleLibraryRefresh(type: LibraryRefreshType) {
    const runId = libraryRefreshRunIdRef.current + 1;
    libraryRefreshRunIdRef.current = runId;
    setRefreshingLibrary(type);
    setLibraryRefreshStatus("running");
    setLibraryRefreshMessage(formatLibraryRefreshMessage(type, "running"));

    const isCurrentRefresh = () => libraryRefreshRunIdRef.current === runId;

    try {
      let response = await client.startLibraryScan(type === "full");

      while (isCurrentRefresh() && response.scanStatus?.scanning) {
        setLibraryRefreshStatus("running");
        setLibraryRefreshMessage(
          formatLibraryRefreshMessage(
            type,
            "running",
            response.scanStatus.count,
          ),
        );
        await wait(2000);
        if (!isCurrentRefresh()) return;
        response = await client.getLibraryScanStatus();
      }

      if (!isCurrentRefresh()) return;

      if (response.scanStatus?.error) {
        setLibraryRefreshStatus("error");
        setLibraryRefreshMessage(response.scanStatus.error);
        return;
      }

      setLibraryRefreshStatus("success");
      setLibraryRefreshMessage(
        formatLibraryRefreshMessage(
          type,
          "success",
          response.scanStatus?.count,
        ),
      );
    } catch (err) {
      if (!isCurrentRefresh()) return;
      setLibraryRefreshStatus("error");
      setLibraryRefreshMessage(
        err instanceof Error ? err.message : "Failed to start library refresh",
      );
    } finally {
      if (isCurrentRefresh()) {
        setRefreshingLibrary(null);
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-labelledby="settings-title">
      <div className="w-full max-w-md">
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

            <div className="border-zinc-800 border-t pt-4">
              <h3 className="mb-2 font-semibold text-sm text-zinc-300">
                Administration
              </h3>
              <p className="mb-3 text-sm text-zinc-500">
                Ask Navidrome to refresh its music library.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  onClick={() => handleLibraryRefresh("quick")}
                  disabled={refreshingLibrary !== null}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshingLibrary === "quick" ? "animate-spin" : ""
                    }`}
                  />
                  Quick Refresh
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleLibraryRefresh("full")}
                  disabled={refreshingLibrary !== null}
                >
                  <Database className="h-4 w-4" />
                  {refreshingLibrary === "full"
                    ? "Refreshing..."
                    : "Full Refresh"}
                </Button>
              </div>
            </div>

            {libraryRefreshStatus === "error" && libraryRefreshMessage && (
              <InlineAlert variant="error">{libraryRefreshMessage}</InlineAlert>
            )}

            {libraryRefreshStatus === "running" && libraryRefreshMessage && (
              <InlineAlert variant="info">{libraryRefreshMessage}</InlineAlert>
            )}

            {libraryRefreshStatus === "success" && libraryRefreshMessage && (
              <InlineAlert variant="success">
                {libraryRefreshMessage}
              </InlineAlert>
            )}

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
