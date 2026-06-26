# Immersive Shaders

Drop single-pass Shadertoy Image shaders in this folder as `.frag` files.

Each file must define:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  // shader code
}
```

The renderer provides these uniforms:

```glsl
uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;
```

Unsupported for now: `iChannel0-3`, buffers, cubemaps, audio, webcam, video, and multipass shaders.

Filenames become shader ids and display names. For example, `blue-nebula.frag`
becomes `blue-nebula` and `Blue Nebula`. The app bundles every `.frag` file in
this folder at build time, picks a random shader for the immersive background,
and rotates to another shader while playback continues. The shuffle button in
the immersive view also advances to another shader.
