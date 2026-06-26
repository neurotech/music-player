// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// Copyright (c) 2026 @Frostbyte
//[LICENSE] https://creativecommons.org/licenses/by-nc-sa/4.0/
//Super Golfed: https://fragcoord.xyz/s/fg2f9rre

//Code golfed down to 324 chars by Diatribes
void mainImage(out vec4 O, vec2 C) {
    float d = 0.0;
    float z = 0.0;
    vec3 p = vec3(0.0);
    vec3 r = iResolution;
    O = vec4(0.0);

    for (int i = 0; i < 100; i++) {
        p = z * normalize(vec3(C.xy - 0.5 * r.xy, r.y));
        p = abs(fract(vec3(mat2(cos(cos(z * 0.5) + vec4(0.0, 11.0, 33.0, 0.0))) * p.xy * 2.0, p.z - iTime)) - 0.5) - 0.5;
        d = abs(length(max(p, 0.25)) + max(p.x, max(p.y, p.z * 3.0))) / 3.0 + abs(sin(z * 0.7 - iTime)) * 0.001;
        z += d * 0.8;
        O += 1.0 / d;
    }

    O *= vec4(p + 0.8, 0) * z / 7e4;
}
