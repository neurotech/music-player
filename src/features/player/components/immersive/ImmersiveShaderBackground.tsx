import { useEffect, useRef, useState } from "react";

import {
  type ImmersiveShader,
  selectRandomImmersiveShader,
} from "./immersiveShaders";

const MAX_DEVICE_PIXEL_RATIO = 1.5;
const CROSSFADE_MS = 1200;

const VERTEX_SOURCE = `
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_PREFIX = `
#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;

float round(float value) {
  return floor(value + 0.5);
}

vec2 round(vec2 value) {
  return floor(value + 0.5);
}

vec3 round(vec3 value) {
  return floor(value + 0.5);
}

vec4 round(vec4 value) {
  return floor(value + 0.5);
}

float tanh(float value) {
  float e = exp(2.0 * clamp(value, -10.0, 10.0));
  return (e - 1.0) / (e + 1.0);
}

vec2 tanh(vec2 value) {
  vec2 e = exp(2.0 * clamp(value, -10.0, 10.0));
  return (e - 1.0) / (e + 1.0);
}

vec3 tanh(vec3 value) {
  vec3 e = exp(2.0 * clamp(value, -10.0, 10.0));
  return (e - 1.0) / (e + 1.0);
}

vec4 tanh(vec4 value) {
  vec4 e = exp(2.0 * clamp(value, -10.0, 10.0));
  return (e - 1.0) / (e + 1.0);
}
`;

const FRAGMENT_SUFFIX = `
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

interface ImmersiveShaderBackgroundProps {
  changeKey: string;
  onShaderChange?: (shader: ImmersiveShader) => void;
}

interface ShaderLayer {
  id: string;
  shader: ImmersiveShader;
  isVisible: boolean;
}

interface ShaderProgram {
  program: WebGLProgram;
  buffer: WebGLBuffer;
  aPosition: number;
  uniforms: {
    iResolution: WebGLUniformLocation | null;
    iTime: WebGLUniformLocation | null;
    iTimeDelta: WebGLUniformLocation | null;
    iFrame: WebGLUniformLocation | null;
    iMouse: WebGLUniformLocation | null;
  };
}

export function ImmersiveShaderBackground({
  changeKey,
  onShaderChange,
}: ImmersiveShaderBackgroundProps) {
  const initialShader = useRef<ImmersiveShader | null>(null);
  if (!initialShader.current) {
    initialShader.current = selectRandomImmersiveShader();
  }

  const previousChangeKey = useRef(changeKey);
  const currentShaderId = useRef(initialShader.current.id);
  const layerSeq = useRef(0);
  const [layers, setLayers] = useState<ShaderLayer[]>(() => [
    {
      id: `initial:${initialShader.current?.id ?? "shader"}`,
      shader: initialShader.current as ImmersiveShader,
      isVisible: true,
    },
  ]);

  useEffect(() => {
    if (initialShader.current) {
      onShaderChange?.(initialShader.current);
    }
  }, [onShaderChange]);

  useEffect(() => {
    if (previousChangeKey.current === changeKey) return;
    previousChangeKey.current = changeKey;

    const nextShader = selectRandomImmersiveShader(currentShaderId.current);
    const nextLayerId = `${changeKey}:${nextShader.id}:${layerSeq.current}`;
    layerSeq.current += 1;
    currentShaderId.current = nextShader.id;
    onShaderChange?.(nextShader);

    setLayers((currentLayers) => [
      ...currentLayers.map((layer) => ({ ...layer, isVisible: false })),
      {
        id: nextLayerId,
        shader: nextShader,
        isVisible: false,
      },
    ]);

    const rafId = requestAnimationFrame(() => {
      setLayers((currentLayers) =>
        currentLayers.map((layer) =>
          layer.id === nextLayerId ? { ...layer, isVisible: true } : layer,
        ),
      );
    });
    const timeoutId = window.setTimeout(() => {
      setLayers((currentLayers) =>
        currentLayers.filter((layer) => layer.id === nextLayerId),
      );
    }, CROSSFADE_MS);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [changeKey, onShaderChange]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 bg-black"
      aria-hidden="true"
    >
      {layers.map((layer, index) => (
        <div
          key={layer.id}
          className="absolute inset-0 transition-opacity ease-in-out"
          style={{
            opacity: layer.isVisible ? 1 : 0,
            transitionDuration: `${CROSSFADE_MS}ms`,
            zIndex: index,
          }}
        >
          <ImmersiveShaderCanvas shader={layer.shader} />
        </div>
      ))}
    </div>
  );
}

interface ImmersiveShaderCanvasProps {
  shader: ImmersiveShader;
}

function ImmersiveShaderCanvas({ shader }: ImmersiveShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasRenderFailure, setHasRenderFailure] = useState(false);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const canvas = canvasElement;

    const webglContext = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "high-performance",
      stencil: false,
    });

    if (!webglContext) {
      setHasRenderFailure(true);
      return;
    }
    const gl = webglContext;
    const activateProgram = gl.useProgram.bind(gl);

    let programInfo: ShaderProgram | null = null;
    let rafId = 0;
    let frame = 0;
    const startTime = performance.now();
    let lastTime = performance.now();
    let disposed = false;

    try {
      programInfo = createShaderProgram(gl, shader.fragmentSource);
      setHasRenderFailure(false);
    } catch (err) {
      console.warn(`Failed to render immersive shader "${shader.name}":`, err);
      setHasRenderFailure(true);
      return;
    }

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(
        window.devicePixelRatio || 1,
        MAX_DEVICE_PIXEL_RATIO,
      );
      const width = Math.max(1, Math.floor(rect.width * scale));
      const height = Math.max(1, Math.floor(rect.height * scale));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);
    }

    function render(now: number) {
      if (disposed || !programInfo) return;

      resizeCanvas();

      const elapsedSeconds = (now - startTime) * 0.001;
      const deltaSeconds = Math.max(0, (now - lastTime) * 0.001);
      lastTime = now;

      activateProgram(programInfo.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.buffer);
      gl.enableVertexAttribArray(programInfo.aPosition);
      gl.vertexAttribPointer(programInfo.aPosition, 2, gl.FLOAT, false, 0, 0);

      gl.uniform3f(
        programInfo.uniforms.iResolution,
        canvas.width,
        canvas.height,
        1,
      );
      gl.uniform1f(programInfo.uniforms.iTime, elapsedSeconds);
      gl.uniform1f(programInfo.uniforms.iTimeDelta, deltaSeconds);
      gl.uniform1i(programInfo.uniforms.iFrame, frame);
      gl.uniform4f(programInfo.uniforms.iMouse, 0, 0, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      frame += 1;
      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      if (programInfo) {
        gl.deleteBuffer(programInfo.buffer);
        gl.deleteProgram(programInfo.program);
      }
    };
  }, [shader]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ display: hasRenderFailure ? "none" : "block" }}
    />
  );
}

function createShaderProgram(
  gl: WebGLRenderingContext,
  fragmentSource: string,
): ShaderProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
  let fragmentShader: WebGLShader | null = null;
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertexShader);
    throw new Error("Unable to create WebGL program");
  }

  try {
    gl.getExtension("OES_standard_derivatives");

    fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      `${FRAGMENT_PREFIX}\n${fragmentSource}\n${FRAGMENT_SUFFIX}`,
    );

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.bindAttribLocation(program, 0, "aPosition");
    gl.linkProgram(program);
  } finally {
    gl.deleteShader(vertexShader);
    if (fragmentShader) {
      gl.deleteShader(fragmentShader);
    }
  }

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown link error";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  const buffer = gl.createBuffer();
  if (!buffer) {
    gl.deleteProgram(program);
    throw new Error("Unable to create fullscreen triangle buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );

  return {
    program,
    buffer,
    aPosition: 0,
    uniforms: {
      iResolution: gl.getUniformLocation(program, "iResolution"),
      iTime: gl.getUniformLocation(program, "iTime"),
      iTimeDelta: gl.getUniformLocation(program, "iTimeDelta"),
      iFrame: gl.getUniformLocation(program, "iFrame"),
      iMouse: gl.getUniformLocation(program, "iMouse"),
    },
  };
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Unable to create WebGL shader");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown compile error";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}
