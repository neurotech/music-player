import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { InlineAlert } from "@/components/InlineAlert";
import { Input } from "@/components/Input";
import { panelClass } from "@/components/panel-styles";
import type { SubsonicCredentials } from "@/types/subsonic";

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

  useEffect(() => {
    if (initialCredentials) {
      setServerUrl(initialCredentials.serverUrl);
      setUsername(initialCredentials.username);
      setPassword(initialCredentials.password);
    } else {
      setServerUrl("");
      setUsername("");
      setPassword("");
    }
  }, [initialCredentials]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onConnect({ serverUrl, username, password });
  }

  return (
    <div className="w-full max-w-sm">
      <div className={panelClass}>
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
            <Input
              id="serverUrl"
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://your-navidrome-server.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-1 block font-medium text-sm text-zinc-400"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block font-medium text-sm text-zinc-400"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
            />
          </div>

          {error && <InlineAlert variant="error">{error}</InlineAlert>}

          <Button type="submit" disabled={isConnecting} className="w-full">
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        </form>
      </div>
    </div>
  );
}
