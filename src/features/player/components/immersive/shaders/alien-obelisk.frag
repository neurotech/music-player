// Alien Obelisk
//
// Adapted for the local immersive WebGL renderer:
// - Replaces Shadertoy iChannel0 blue-noise texture dithering with procedural
//   hash dithering because drop-in shaders do not receive iChannel uniforms.
// - Uses an integer raymarch loop for WebGL GLSL ES compatibility.
//
// === References ==
// Blue noise dithering: Spalmer's blue noise (banding reduction)
//   - https://www.shadertoy.com/view/3sVXWw
// Round cube SDF: based on IQ's SDF primitives
//   - http://iquilezles.org/articles/distfunctions/
// Contrast function: simple linear remap
// Gyroid field: distance-like field from IQ & Karlik "Gyroid Travel"
//   - https://www.shadertoy.com/view/3syfW1
// Raymarch structure: classic IQ sphere tracing loop
//   - https://iquilezles.org/articles/raymarching/

#define T (iTime + 800.0)
#define rot(a) mat2(cos(a), -sin(a), sin(a), cos(a))

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float ditherNoise(vec2 p) {
  vec2 cell = floor(p);
  float frame = mod(float(iFrame), 4.0);
  return hash21(cell + frame * vec2(37.17, 19.79));
}

vec3 applyContrast(vec3 c, float contrast) {
  return clamp((c - 0.5) * contrast + 0.5, 0.0, 1.0);
}

float sdRoundCube(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return max(max(q.x, q.y), q.z);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float s = 1.0;
  float d = 0.0;

  vec3 r = iResolution;
  vec3 ro = vec3(0.0, 0.0, T);
  vec3 rayDirection = vec3((fragCoord - r.xy * 0.5) / r.y, 1.0) * 0.5;
  vec4 color = vec4(0.0);

  for (int rayStep = 0; rayStep < 100; rayStep++) {
    if (s <= 0.0001) break;

    vec3 p = ro + rayDirection * d;

    p.xy *= rot(p.z * 0.1 + sin(p.z * 0.01));
    vec3 obeliskPoint = p;

    p.x -= 0.5 + sin(p.y * 1.5 + cos(p.z * 2.0 + T * 0.1));
    vec3 colorPoint = p;

    p = abs(p) * 0.35;
    obeliskPoint.z -= 25.0 + T;
    obeliskPoint.xz *= rot(T);
    obeliskPoint.xy *= rot(T * 0.5);

    float cubeDist = sdRoundCube(
      obeliskPoint * 0.6,
      vec3(1.1 + sin(T * 0.7) * 0.7)
    );
    float gyroidDist = length(p.xy) - 2.4;
    float sceneDist = min(-gyroidDist, cubeDist);

    s = abs(sceneDist);
    d += s;

    float fade = smoothstep(0.1, 0.001, s);
    float cubeWeight = smoothstep(5.0, 0.0, cubeDist * 2.0) * 9.0;

    vec3 proceduralColor = cos(d * 1e-7 - 1.98) *
      sin(
        vec3(colorPoint.xy, 15.0) * 0.05 -
          vec3(cos(colorPoint.x * 0.1), length(p.xy), 6.0)
      ) * 0.013 - 0.006;

    proceduralColor += proceduralColor *
      (cubeWeight + 0.4) *
      ((length(p.xy * 0.75) + 3.0) * 0.75);

    color.rgb += proceduralColor * fade;
  }

  color.rgb = (0.0 - color.rgb) * exp(-d / 21.0);
  color.rgb = pow(max(color.rgb, vec3(0.0)), vec3(1.0 / 2.2));
  color.rgb = applyContrast(color.rgb, 1.08);

  float dither = ditherNoise(fragCoord) - 0.5;
  color.rgb += dither / 255.0;

  fragColor = tanh(color * color * 4.0);
}
