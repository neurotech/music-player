// CC0: Smaller Waterfall
//  Trying to minimize the previous waterfall shader a bit.
//  I probably missed something obvious as usual.

// This file is released under CC0 1.0 Universal (Public Domain Dedication).
// To the extent possible under law, mrange has waived all copyright
// and related or neighboring rights to this work.
// See <https://creativecommons.org/publicdomain/zero/1.0/> for details.

// Suggested by: moonlightoctopus
#define L length

float roundCompat(float value) {
  return floor(value + 0.5);
}

vec2 roundCompat(vec2 value) {
  return floor(value + 0.5);
}

vec4 tanhCompat(vec4 value) {
  vec4 e = exp(2.0 * clamp(value, -10.0, 10.0));
  return (e - 1.0) / (e + 1.0);
}

void mainImage(out vec4 o, vec2 C) {
  float z = 0.0;
  float T = 0.1 * iTime + 9.0;
  float d = T;

  vec2
  r = iResolution.xy, P = (C + C - r) / r.x, Y = vec2(5e-3, 1.0);

  vec4
  U = vec4(0.0, 1.0, 2.0, 4.0), O = vec4(0.0);

  for (int rayStep = 1; rayStep < 39; rayStep++) {
    if (d <= 1e-4) {
      break;
    }
    O = z * normalize(vec4(P, 2.0, 0.0)) - U.xwyx / 4.5;
    d = 1.0 - sqrt(L(O * O));
    z += d;
  }

  C = vec2(O.x, atan(O.z, O.y));
  P = U.zy * P - r / r.x * U.xy;
  O = vec4(4.0, 16.0, 99.0, 0.0) / (1e3 * dot(P, P) + 6.0);
  z = 5e-4;
  r = L(fwidth(C)) * U.yy;

  for (int dropIndex = 1; dropIndex < 9; dropIndex++) {
    float j = float(dropIndex);
    float i = fract(
      sin(dot(vec2(j, roundCompat(C.x / Y.x)), 7.0 + U.xw) * 73.0)
    );
    P = C - (T + T * i) * U.xy;
    P -= roundCompat(P / Y) * Y;
    vec4 dropColor = 1.0 + sin(T + 7.0 * fract(8663.0 * i) + U);
    vec2 edge = vec2(L(max(P, -U.yx)), L(P) - z) - z;
    float splash = dot(
      smoothstep(r, -r, edge),
      vec2(exp(19.0 * P.y), 3.0)
    );
    O += splash * dropColor * dropColor.w;
    C.x += Y.x / 8.0;
  }

  o = sqrt(max(vec4(0.0), tanhCompat(O - 0.02 * U.zwyy)));
}
