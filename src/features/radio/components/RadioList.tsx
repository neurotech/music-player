import {
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  type FormEvent,
  type MouseEvent,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Button } from "@/components/Button";
import { InlineAlert } from "@/components/InlineAlert";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { ModalHeader } from "@/components/ModalHeader";
import { panelClass } from "@/components/panel-styles";
import { player } from "@/features/player/lib/player";
import { cn } from "@/lib/cn";
import type { SubsonicClient } from "@/lib/subsonic-client";
import type { InternetRadioStation } from "@/types/subsonic";

interface RadioListProps {
  client: SubsonicClient;
}

interface RadioCardProps {
  station: InternetRadioStation;
  isPlaying: boolean;
  onPlay: (station: InternetRadioStation) => void;
  onEdit: (station: InternetRadioStation) => void;
  onDelete: (station: InternetRadioStation) => void;
}

interface RadioFormData {
  name: string;
  streamUrl: string;
  homePageUrl: string;
}

interface RadioModalProps {
  isOpen: boolean;
  station: InternetRadioStation | null;
  onClose: () => void;
  onSave: (data: RadioFormData) => Promise<void>;
  saving: boolean;
}

const RadioModal = memo(function RadioModal({
  isOpen,
  station,
  onClose,
  onSave,
  saving,
}: RadioModalProps) {
  const [formData, setFormData] = useState<RadioFormData>({
    name: "",
    streamUrl: "",
    homePageUrl: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: station?.name || "",
        streamUrl: station?.streamUrl || "",
        homePageUrl: station?.homePageUrl || "",
      });
      setError(null);
    }
  }, [isOpen, station]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.streamUrl.trim()) {
      setError("Name and Stream URL are required");
      return;
    }
    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save station");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-labelledby="radio-form-title">
      <div className="w-full max-w-md">
        <div className={panelClass}>
          <ModalHeader
            title={station ? "Edit Station" : "Add Station"}
            titleId="radio-form-title"
            onClose={onClose}
            closeLabel="Close radio station form"
          />
          <form onSubmit={handleSubmit} className="space-y-3 p-3">
            <div>
              <label
                htmlFor="radio-name"
                className="mb-1 block font-medium text-sm text-zinc-400"
              >
                Name *
              </label>
              <Input
                id="radio-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Station name"
              />
            </div>
            <div>
              <label
                htmlFor="radio-stream-url"
                className="mb-1 block font-medium text-sm text-zinc-400"
              >
                Stream URL *
              </label>
              <Input
                id="radio-stream-url"
                type="url"
                value={formData.streamUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    streamUrl: e.target.value,
                  }))
                }
                placeholder="https://stream.example.com/radio"
              />
            </div>
            <div>
              <label
                htmlFor="radio-home-page-url"
                className="mb-1 block font-medium text-sm text-zinc-400"
              >
                Website URL (optional)
              </label>
              <Input
                id="radio-home-page-url"
                type="url"
                value={formData.homePageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    homePageUrl: e.target.value,
                  }))
                }
                placeholder="https://example.com"
              />
            </div>
            {error && <InlineAlert variant="error">{error}</InlineAlert>}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : station ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
});

interface DeleteConfirmModalProps {
  isOpen: boolean;
  station: InternetRadioStation | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deleting: boolean;
}

const DeleteConfirmModal = memo(function DeleteConfirmModal({
  isOpen,
  station,
  onClose,
  onConfirm,
  deleting,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen && station !== null}
      onClose={onClose}
      aria-labelledby="delete-radio-station-title"
      aria-describedby="delete-radio-station-description"
    >
      <div className="w-full max-w-sm">
        <div className={panelClass}>
          <ModalHeader
            title="Delete Station"
            titleId="delete-radio-station-title"
            onClose={onClose}
            closeLabel="Cancel deleting radio station"
          />
          <div className="space-y-4 p-3">
            <p
              id="delete-radio-station-description"
              className="text-sm text-zinc-400"
            >
              Are you sure you want to delete &quot;{station?.name}&quot;? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={onConfirm}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
});

const RadioCard = memo(function RadioCard({
  station,
  isPlaying,
  onPlay,
  onEdit,
  onDelete,
}: RadioCardProps) {
  const handleClick = useCallback(() => {
    onPlay(station);
  }, [onPlay, station]);

  const handleEdit = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      onEdit(station);
    },
    [onEdit, station],
  );

  const handleDelete = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      onDelete(station);
    },
    [onDelete, station],
  );

  return (
    <div
      className={cn(
        "group flex w-full items-center rounded-sm border transition-colors",
        isPlaying
          ? "border-indigo-500 bg-indigo-500/10"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700",
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-3 text-left"
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm",
            isPlaying
              ? "bg-indigo-500/20 text-indigo-400"
              : "bg-zinc-800 text-zinc-500",
          )}
        >
          <Radio className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "truncate font-medium text-sm",
              isPlaying
                ? "text-indigo-400"
                : "text-zinc-200 group-hover:text-indigo-400",
            )}
          >
            {station.name}
          </h3>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1 pr-3">
        {station.homePageUrl && (
          <a
            href={station.homePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open station website"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="sr-only">Open station website</span>
          </a>
        )}
        {isPlaying ? (
          <div className="flex items-center gap-1 pl-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400"
              style={{ animationDelay: "0.2s" }}
            />
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        ) : (
          <div className="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleEdit}
              title="Edit station"
              className="text-zinc-500"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              title="Delete station"
              className="text-zinc-500 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

export const RadioList = memo(function RadioList({ client }: RadioListProps) {
  const [stations, setStations] = useState<InternetRadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRadioId, setCurrentRadioId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStation, setEditingStation] =
    useState<InternetRadioStation | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStation, setDeletingStation] =
    useState<InternetRadioStation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStations = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const radioStations = await client.getInternetRadioStations();
        setStations(radioStations);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch radio stations",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [client],
  );

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  useEffect(() => {
    return player.subscribe((state) => {
      if (state.currentRadio) {
        setCurrentRadioId(state.currentRadio.id);
      } else {
        setCurrentRadioId(null);
      }
    });
  }, []);

  const handlePlayRadio = useCallback(async (station: InternetRadioStation) => {
    try {
      await player.playRadio(station);
    } catch (err) {
      console.error("Failed to play radio station:", err);
    }
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingStation(null);
    setModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((station: InternetRadioStation) => {
    setEditingStation(station);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingStation(null);
  }, []);

  const handleSave = useCallback(
    async (data: RadioFormData) => {
      setSaving(true);
      try {
        if (editingStation) {
          await client.updateInternetRadioStation(
            editingStation.id,
            data.name.trim(),
            data.streamUrl.trim(),
            data.homePageUrl.trim() || undefined,
          );
        } else {
          await client.createInternetRadioStation(
            data.name.trim(),
            data.streamUrl.trim(),
            data.homePageUrl.trim() || undefined,
          );
        }
        setModalOpen(false);
        setEditingStation(null);
        await fetchStations(true);
      } finally {
        setSaving(false);
      }
    },
    [client, editingStation, fetchStations],
  );

  const handleOpenDelete = useCallback((station: InternetRadioStation) => {
    setDeletingStation(station);
    setDeleteModalOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setDeletingStation(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingStation) return;
    setDeleting(true);
    try {
      if (currentRadioId === deletingStation.id) {
        player.stop();
      }
      await client.deleteInternetRadioStation(deletingStation.id);
      setDeleteModalOpen(false);
      setDeletingStation(null);
      await fetchStations(true);
    } finally {
      setDeleting(false);
    }
  }, [client, currentRadioId, deletingStation, fetchStations]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <>
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Radio className="h-12 w-12 text-zinc-700" />
          <p className="text-center text-sm text-zinc-500">
            No radio stations configured.
          </p>
          <Button size="lg" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            Add Station
          </Button>
        </div>
        <RadioModal
          isOpen={modalOpen}
          station={editingStation}
          onClose={handleCloseModal}
          onSave={handleSave}
          saving={saving}
        />
      </>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
        <div>
          <h2 className="font-medium text-lg text-zinc-200">Internet Radio</h2>
          <p className="text-sm text-zinc-500">
            {stations.length} station{stations.length !== 1 ? "s" : ""}{" "}
            available
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
          <Button
            variant="secondary"
            onClick={() => fetchStations(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {stations.map((station) => (
            <RadioCard
              key={station.id}
              station={station}
              isPlaying={currentRadioId === station.id}
              onPlay={handlePlayRadio}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      </div>
      <RadioModal
        isOpen={modalOpen}
        station={editingStation}
        onClose={handleCloseModal}
        onSave={handleSave}
        saving={saving}
      />
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        station={deletingStation}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
});
