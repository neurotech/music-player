export interface ImmersiveShader {
  id: string;
  name: string;
  fragmentSource: string;
  sourcePath: string;
}

const shaderModules = import.meta.glob<string>("./shaders/*.frag", {
  eager: true,
  import: "default",
  query: "?raw",
});

export const immersiveShaders: ImmersiveShader[] = Object.entries(shaderModules)
  .map(([sourcePath, fragmentSource]) => {
    const parts = sourcePath.split("/");
    const filename = parts[parts.length - 1] ?? sourcePath;
    const id = filename.replace(/\.frag$/i, "");

    return {
      id,
      name: shaderNameFromId(id),
      fragmentSource,
      sourcePath,
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

export const defaultImmersiveShader = immersiveShaders[0];
let remainingRandomShaderIds: string[] = [];

export function selectImmersiveShader(seed: string): ImmersiveShader {
  if (!defaultImmersiveShader) {
    throw new Error(
      "At least one immersive shader must exist in components/immersive/shaders",
    );
  }

  const index = hashString(seed) % immersiveShaders.length;
  return immersiveShaders[index] ?? defaultImmersiveShader;
}

export function selectRandomImmersiveShader(
  previousShaderId?: string,
): ImmersiveShader {
  if (!defaultImmersiveShader) {
    throw new Error(
      "At least one immersive shader must exist in components/immersive/shaders",
    );
  }

  const availableShaderIds = new Set(
    immersiveShaders.map((shader) => shader.id),
  );
  remainingRandomShaderIds = remainingRandomShaderIds.filter((id) =>
    availableShaderIds.has(id),
  );

  if (remainingRandomShaderIds.length === 0) {
    remainingRandomShaderIds = immersiveShaders.map((shader) => shader.id);
  }

  let candidateIds = remainingRandomShaderIds;
  if (candidateIds.length > 1 && previousShaderId) {
    candidateIds = candidateIds.filter((id) => id !== previousShaderId);
  }

  const index = Math.floor(Math.random() * candidateIds.length);
  const selectedId = candidateIds[index] ?? defaultImmersiveShader.id;
  remainingRandomShaderIds = remainingRandomShaderIds.filter(
    (id) => id !== selectedId,
  );

  return (
    immersiveShaders.find((shader) => shader.id === selectedId) ??
    defaultImmersiveShader
  );
}

function shaderNameFromId(id: string) {
  return id
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}
