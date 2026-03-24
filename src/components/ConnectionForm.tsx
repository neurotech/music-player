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
      <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden shadow-[0_1px_rgba(255,255,255,0.05)_inset]">
        <div className="bg-zinc-800/80 px-3 py-2 border-b border-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-100">
            Connect to Navidrome
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          <div>
            <label
              htmlFor="serverUrl"
              className="block text-sm font-medium text-zinc-400 mb-1"
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
              className="w-full px-2 py-1.5 text-sm rounded-sm bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-zinc-400 mb-1"
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
              className="w-full px-2 py-1.5 text-sm rounded-sm bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-400 mb-1"
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
              className="w-full px-2 py-1.5 text-sm rounded-sm bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/50 border border-red-900/50 px-2 py-1.5 rounded-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isConnecting}
            className="w-full px-2 py-1.5 text-sm font-semibold rounded-sm border border-zinc-900 bg-indigo-600 bg-linear-to-b from-indigo-400/60 to-indigo-800 hover:from-indigo-400/90 hover:to-indigo-800/80 disabled:bg-zinc-900/70 disabled:from-zinc-800/50 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors shadow-[0_1px_rgba(255,255,255,0.2)_inset,0_1px_1px_rgba(0,0,0,0.1)] cursor-pointer select-none"
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}
