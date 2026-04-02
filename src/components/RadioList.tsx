import {
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { player } from "../lib/player";
import type { InternetRadioStation, SubsonicClient } from "../lib/subsonic";

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

  const handleSubmit = async (e: React.FormEvent) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-sm border border-zinc-700 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium text-lg text-zinc-200">
            {station ? "Edit Station" : "Add Station"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm text-zinc-400">
              Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-sm border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              placeholder="Station name"
            />
          </div>
          <div>
            <label
              htmlFor="streamUrl"
              className="mb-1 block text-sm text-zinc-400"
            >
              Stream URL *
            </label>
            <input
              id="streamUrl"
              type="url"
              value={formData.streamUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, streamUrl: e.target.value }))
              }
              className="w-full rounded-sm border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              placeholder="https://stream.example.com/radio"
            />
          </div>
          <div>
            <label
              htmlFor="homePageUrl"
              className="mb-1 block text-sm text-zinc-400"
            >
              Website URL (optional)
            </label>
            <input
              id="homePageUrl"
              type="url"
              value={formData.homePageUrl}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  homePageUrl: e.target.value,
                }))
              }
              className="w-full rounded-sm border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              placeholder="https://example.com"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-sm border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 px-4 py-2 font-semibold text-sm shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] transition-colors hover:from-indigo-400/90 hover:to-indigo-800/80 disabled:cursor-not-allowed disabled:bg-zinc-900/70 disabled:from-zinc-800/50 disabled:to-zinc-800 disabled:text-zinc-500"
            >
              {saving ? "Saving..." : station ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  if (!isOpen || !station) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-sm border border-zinc-700 bg-zinc-900 p-6">
        <h3 className="mb-2 font-medium text-lg text-zinc-200">
          Delete Station
        </h3>
        <p className="mb-4 text-sm text-zinc-400">
          Are you sure you want to delete "{station.name}"? This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-sm border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-sm bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
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
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(station);
    },
    [onEdit, station],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(station);
    },
    [onDelete, station],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group flex w-full cursor-pointer flex-row items-center gap-3 rounded-sm border p-3 text-left transition-colors ${
        isPlaying
          ? "border-indigo-500 bg-indigo-500/10"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${
          isPlaying
            ? "bg-indigo-500/20 text-indigo-400"
            : "bg-zinc-800 text-zinc-500"
        }`}
      >
        <Radio className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 h-full flex flex-col justify-between">
        <h3
          className={`truncate font-medium text-sm ${
            isPlaying
              ? "text-indigo-400"
              : "text-zinc-200 group-hover:text-indigo-400"
          }`}
        >
          {station.name}
        </h3>
        {station.homePageUrl && (
          <a
            href={station.homePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 truncate text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ExternalLink className="h-3 w-3" />
            Website
          </a>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isPlaying ? (
          <>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400"
              style={{ animationDelay: "0.2s" }}
            />
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400"
              style={{ animationDelay: "0.4s" }}
            />
          </>
        ) : (
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={handleEdit}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
              title="Edit station"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-red-400"
              title="Delete station"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </button>
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
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 px-4 py-2 font-semibold text-sm shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] transition-colors hover:from-indigo-400/90 hover:to-indigo-800/80"
          >
            <Plus className="h-4 w-4" />
            Add Station
          </button>
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
      <div className="flex items-start justify-between pb-4">
        <div>
          <h2 className="font-medium text-lg text-zinc-200">Internet Radio</h2>
          <p className="text-sm text-zinc-500">
            {stations.length} station{stations.length !== 1 ? "s" : ""}{" "}
            available
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 px-3 py-1.5 font-semibold text-sm shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] transition-colors hover:from-indigo-400/90 hover:to-indigo-800/80"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
          <button
            type="button"
            onClick={() => fetchStations(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-sm border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
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
