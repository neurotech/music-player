import { useState } from "react";
import type { SubsonicCredentials } from "../lib/subsonic";

interface ConnectionFormProps {
  onConnect: (credentials: SubsonicCredentials) => void;
  isConnecting: boolean;
  error: string | null;
  initialCredentials?: SubsonicCredentials | null;
}

export function ConnectionForm({
  onConnect,
  isConnecting,
  error,
  initialCredentials,
}: ConnectionFormProps) {
  const [serverUrl, setServerUrl] = useState(
    initialCredentials?.serverUrl || "",
  );
  const [username, setUsername] = useState(initialCredentials?.username || "");
  const [password, setPassword] = useState(initialCredentials?.password || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConnect({ serverUrl, username, password });
  }

  return (
    <div className="w-full max-w-sm">
      <div className="overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900 shadow-[0_1px_rgba(255,255,255,0.05)_inset]">
        <div className="border-zinc-900 border-b bg-zinc-800/80 px-3 py-2">
          <h2 className="font-semibold text-sm text-zinc-100">
            Connect to Navidrome
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-3">
          <div>
            <label
              htmlFor="serverUrl"
              className="mb-1 block font-medium text-sm text-zinc-400"
            >
              Server URL
            </label>
            <input
              id="serverUrl"
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://your-navidrome-server.com"
              required
              className="w-full rounded-sm border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-1 block font-medium text-sm text-zinc-400"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              className="w-full rounded-sm border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block font-medium text-sm text-zinc-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
              className="w-full rounded-sm border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-sm border border-red-900/50 bg-red-950/50 px-2 py-1.5 text-red-400 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isConnecting}
            className="w-full cursor-pointer select-none rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 px-2 py-1.5 font-semibold text-sm shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] transition-colors hover:from-indigo-400/90 hover:to-indigo-800/80 disabled:cursor-not-allowed disabled:bg-zinc-900/70 disabled:from-zinc-800/50 disabled:to-zinc-800 disabled:text-zinc-500"
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}
