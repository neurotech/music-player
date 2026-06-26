float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    amplitude *= 0.5;
  }
  return value;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  float t = iTime * 0.18;

  vec2 flow = uv;
  flow.x += sin(uv.y * 2.2 + t * 3.0) * 0.16;
  flow.y += cos(uv.x * 1.8 - t * 2.0) * 0.12;

  float mist = fbm(flow * 1.9 + vec2(t * 0.8, -t * 0.35));
  float bands = sin((uv.y + mist * 0.75 + t) * 5.0) * 0.5 + 0.5;
  float ribbons = smoothstep(0.18, 0.9, bands * mist);
  float pulse = 0.78 + 0.22 * sin(iTime * 0.9);
  float glow = ribbons * pulse;
  float vignette = smoothstep(1.45, 0.16, length(uv));

  vec3 night = vec3(0.015, 0.018, 0.036);
  vec3 teal = vec3(0.08, 0.72, 0.68);
  vec3 violet = vec3(0.48, 0.18, 0.78);
  vec3 ember = vec3(0.95, 0.38, 0.16);

  vec3 color = night;
  color += mix(teal, violet, smoothstep(-0.55, 0.7, uv.x + mist * 0.5)) * glow * 1.65;
  color += ember * pow(max(0.0, 1.0 - abs(uv.y + 0.46 + mist * 0.2) * 2.6), 3.0) * 0.5;
  color += vec3(0.05, 0.08, 0.16) * mist;
  color *= vignette;
  color += vec3(0.03, 0.02, 0.06) * smoothstep(0.9, 0.0, length(uv));

  fragColor = vec4(color, 1.0);
}
