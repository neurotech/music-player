// The Universe Within - by Martijn Steinrucken aka BigWings 2018
// Email:countfrolic@gmail.com Twitter:@The_ArtOfCode
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// Adapted for the local immersive WebGL renderer:
// - Replaces Shadertoy audio FFT texture sampling with a time pulse.
// - Uses integer loop counters for WebGL GLSL ES compatibility.

#define S(a, b, t) smoothstep(a, b, t)
#define NUM_LAYERS 4.

//#define SIMPLE

float N21(vec2 p) {
  vec3 a = fract(vec3(p.xyx) * vec3(213.897, 653.453, 253.098));
  a += dot(a, a.yzx + 79.76);
  return fract((a.x + a.y) * a.z);
}

vec2 GetPos(vec2 id, vec2 offs, float t) {
  float n = N21(id + offs);
  float n1 = fract(n * 10.);
  float n2 = fract(n * 100.);
  float a = t + n;
  return offs + vec2(sin(a * n1), cos(a * n2)) * .4;
}

float GetT(vec2 ro, vec2 rd, vec2 p) {
  return dot(p - ro, rd);
}

float LineDist(vec3 a, vec3 b, vec3 p) {
  return length(cross(b - a, p - a)) / length(p - a);
}

float df_line(in vec2 a, in vec2 b, in vec2 p) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
  return length(pa - ba * h);
}

float line(vec2 a, vec2 b, vec2 uv) {
  float r1 = .04;
  float r2 = .01;

  float d = df_line(a, b, uv);
  float d2 = length(a - b);
  float fade = S(1.5, .5, d2);

  fade += S(.05, .02, abs(d2 - .75));
  return S(r1, r2, d) * fade;
}

float Sparkle(vec2 st, vec2 p, float t) {
  float d = length(st - p);
  float s = (.005 / (d * d));
  s *= S(1., .7, d);
  float pulse = sin((fract(p.x) + fract(p.y) + t) * 5.) * .4 + .6;
  pulse = pow(pulse, 20.);
  return s * pulse;
}

float NetLayer(vec2 st, float n, float t) {
  vec2 id = floor(st) + n;

  st = fract(st) - .5;

  vec2 p0 = GetPos(id, vec2(-1., -1.), t);
  vec2 p1 = GetPos(id, vec2(0., -1.), t);
  vec2 p2 = GetPos(id, vec2(1., -1.), t);
  vec2 p3 = GetPos(id, vec2(-1., 0.), t);
  vec2 p4 = GetPos(id, vec2(0., 0.), t);
  vec2 p5 = GetPos(id, vec2(1., 0.), t);
  vec2 p6 = GetPos(id, vec2(-1., 1.), t);
  vec2 p7 = GetPos(id, vec2(0., 1.), t);
  vec2 p8 = GetPos(id, vec2(1., 1.), t);

  float m = 0.;
  m += line(p4, p0, st);
  m += line(p4, p1, st);
  m += line(p4, p2, st);
  m += line(p4, p3, st);
  m += line(p4, p5, st);
  m += line(p4, p6, st);
  m += line(p4, p7, st);
  m += line(p4, p8, st);

  float sparkle = 0.;
  sparkle += Sparkle(st, p0, t);
  sparkle += Sparkle(st, p1, t);
  sparkle += Sparkle(st, p2, t);
  sparkle += Sparkle(st, p3, t);
  sparkle += Sparkle(st, p4, t);
  sparkle += Sparkle(st, p5, t);
  sparkle += Sparkle(st, p6, t);
  sparkle += Sparkle(st, p7, t);
  sparkle += Sparkle(st, p8, t);

  m += line(p1, p3, st);
  m += line(p1, p5, st);
  m += line(p7, p5, st);
  m += line(p7, p3, st);

  float sPhase = (sin(t + n) + sin(t * .1)) * .25 + .5;
  sPhase += pow(sin(t * .1) * .5 + .5, 50.) * 5.;
  m += sparkle * sPhase;

  return m;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - iResolution.xy * .5) / iResolution.y;
  vec2 M = iMouse.xy / iResolution.xy - .5;

  float t = iTime * .1;

  float s = sin(t);
  float c = cos(t);
  mat2 rot = mat2(c, -s, s, c);
  vec2 st = uv * rot;
  M *= rot * 2.;

  float m = 0.;
  for (int layer = 0; layer < 4; layer++) {
    float i = float(layer) / NUM_LAYERS;
    float z = fract(t + i);
    float size = mix(15., 1., z);
    float fade = S(0., .6, z) * S(1., .8, z);

    m += fade * NetLayer(st * size - M * z, i, iTime);
  }

  float fft = .5 + .5 * sin(iTime * 0.6283185307);
  float glow = -uv.y * fft * 2.;

  vec3 baseCol = vec3(s, cos(t * .4), -sin(t * .24)) * .4 + .6;
  vec3 col = baseCol * m;
  col += baseCol * glow;

#ifdef SIMPLE
  uv *= 10.;
  col = vec3(1.0) * NetLayer(uv, 0., iTime);
  uv = fract(uv);
#else
  col *= 1. - dot(uv, uv);
  t = mod(iTime, 230.);
  col *= S(0., 20., t) * S(224., 200., t);
#endif

  fragColor = vec4(col, 1);
}
