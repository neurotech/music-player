import { useEffect, useRef } from "react";

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_seed;
uniform vec3 u_accent;
uniform float u_mode;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7)) + u_seed.x * 19.7 + u_seed.y * 13.3) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.1;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / u_resolution.xy;
  uv = uv * 2.0 - 1.0;
  uv.x *= u_resolution.x / max(u_resolution.y, 1.0);

  float t = u_time * (0.12 + u_seed.z * 0.08);
  vec2 p = uv * (1.8 + u_seed.y * 0.6) + u_seed.xy * 4.0;

  float m = u_mode;
  vec2 q = p;

  if (m < 0.5) {
    q += vec2(fbm(p + t), fbm(p - t)) * 0.6;
  } else if (m < 1.5) {
    float ang = t * 0.3 + u_seed.x * 6.2831;
    float c = cos(ang), s = sin(ang);
    q = mat2(c, -s, s, c) * p;
    q += vec2(sin(q.y * 3.0 + t * 2.0), cos(q.x * 2.5 - t)) * 0.25;
  } else {
    float r = length(p);
    float a = atan(p.y, p.x) + t * 0.4 + sin(r * 3.0 - t * 2.0) * 0.2;
    q = vec2(cos(a), sin(a)) * r;
  }

  float n1 = fbm(q * 1.3 + vec2(t, -t * 0.7));
  float n2 = fbm(q * 2.1 - vec2(t * 0.5, t));
  float wave = sin(length(q) * 4.0 - t * 3.0 + n1 * 4.0) * 0.5 + 0.5;

  vec3 base = vec3(0.02, 0.02, 0.06);
  vec3 acc = clamp(u_accent, vec3(0.08), vec3(0.95));
  float mixAmt = n1 * 0.55 + n2 * 0.35 + wave * 0.25;
  vec3 col = mix(base, acc * 0.85 + vec3(0.05, 0.02, 0.12), mixAmt);
  col += vec3(0.04, 0.03, 0.08) * sin(t + dot(q, vec2(0.7, 0.5))) * 0.5;

  gl_FragColor = vec4(col, 1.0);
}
`;

export interface ImmersiveVisualizerCanvasProps {
  seedKey: string;
  accentRgb: readonly [number, number, number];
  className?: string;
}

function seedVec3FromKey(key: string): [number, number, number] {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const x = (h >>> 0) / 4294967296;
  const y = ((h / 1000) >>> 0) / 4294967296;
  const z = ((h / 1000000) >>> 0) / 4294967296;
  return [x, y, z];
}

export function ImmersiveVisualizerCanvas({
  seedKey,
  accentRgb,
  className,
}: ImmersiveVisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const accentRef = useRef(accentRgb);
  accentRef.current = accentRgb;

  const seed = seedVec3FromKey(seedKey);
  const seedRef = useRef(seed);
  seedRef.current = seed;

  const modeRef = useRef(Math.floor(seed[0] * 3));
  modeRef.current = Math.floor(seed[0] * 3);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const g = c.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
    if (!g) return;

    const canvasEl = c;
    const glCtx = g;

    const program = createProgram(glCtx, VERT, FRAG);
    if (!program) return;

    const buf = glCtx.createBuffer();
    if (!buf) return;
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buf);
    glCtx.bufferData(
      glCtx.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      glCtx.STATIC_DRAW,
    );

    const aPos = glCtx.getAttribLocation(program, "a_position");
    const uRes = glCtx.getUniformLocation(program, "u_resolution");
    const uTime = glCtx.getUniformLocation(program, "u_time");
    const uSeed = glCtx.getUniformLocation(program, "u_seed");
    const uAccent = glCtx.getUniformLocation(program, "u_accent");
    const uMode = glCtx.getUniformLocation(program, "u_mode");

    let raf = 0;
    const start = performance.now();

    function resize() {
      const w = canvasEl.clientWidth * window.devicePixelRatio;
      const h = canvasEl.clientHeight * window.devicePixelRatio;
      if (canvasEl.width !== w || canvasEl.height !== h) {
        canvasEl.width = w;
        canvasEl.height = h;
      }
      glCtx.viewport(0, 0, canvasEl.width, canvasEl.height);
    }

    function frame() {
      resize();
      // biome-ignore lint/correctness/useHookAtTopLevel: WebGLRenderingContext.useProgram, not React
      glCtx.useProgram(program);
      glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buf);
      glCtx.enableVertexAttribArray(aPos);
      glCtx.vertexAttribPointer(aPos, 2, glCtx.FLOAT, false, 0, 0);

      const s = seedRef.current;
      const a = accentRef.current;
      glCtx.uniform2f(uRes, canvasEl.width, canvasEl.height);
      glCtx.uniform1f(uTime, (performance.now() - start) / 1000);
      glCtx.uniform3f(uSeed, s[0], s[1], s[2]);
      glCtx.uniform3f(uAccent, a[0], a[1], a[2]);
      glCtx.uniform1f(uMode, modeRef.current);

      glCtx.drawArrays(glCtx.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvasEl);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      glCtx.deleteProgram(program);
      glCtx.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
