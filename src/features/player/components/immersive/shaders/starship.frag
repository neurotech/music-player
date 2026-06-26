/*
    "Starship" by @XorDev

    Inspired by the debris from SpaceX's 7th Starship test:
    https://x.com/elonmusk/status/1880040599761596689

    My original twigl version:
    https://x.com/XorDev/status/1880344887033569682

    <512 Chars playlist: shadertoy.com/playlist/N3SyzR
*/

float starshipHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float starshipNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = starshipHash(i);
  float b = starshipHash(i + vec2(1.0, 0.0));
  float c = starshipHash(i + vec2(0.0, 1.0));
  float d = starshipHash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void mainImage(out vec4 O, vec2 I)
{
  //Resolution for scaling
  vec2 r = iResolution.xy,
  //Center, rotate and scale
  p = (I + I - r) / r.y * mat2(3.0, 4.0, 4.0, -3.0) / 1e2;

  //Sum of colors, RGB color shift and wave
  vec4 S = vec4(0.0), C = vec4(1.0, 2.0, 3.0, 0.0), W = vec4(0.0);

  //Time, trailing time and iterator variables
  //Iterate through 50 particles
  float t = iTime;
  float T = .1 * t + p.y;
  for (int particle = 1; particle <= 50; particle++)
  {
    float i = float(particle);

    ///Set color:
    //The sine gives us color index between -1 and +1.
    //Then we give each channel a separate frequency.
    //Red is the broadest, while blue dissipates quickly.
    //Add one to avoid negative color values (0 to 2).
    W = sin(i) * C;
    float cloud = .2 + starshipNoise(p / exp(W.x) + vec2(i, t) / 8.) * 39.8;
    S += (cos(W) + 1.)

        ///Flashing brightness:
        //The brightness fluxuates exponentially between 1/e and e.
        //Each particle has a flash frequency according to its index.
        * exp(sin(i + i * T))

        ///Trail particles with attenuating light:
        //The basic idea is to start with a point light falloff.
        //I used max on the coordinates so that I can scale the
        //positive and negative directions independently.
        //The x axis is scaled down a lot for a long trail.
        //Noise is added to the scaling factor for cloudy depth.
        //The y-axis is also stretched a little for a glare effect.
        //Try a higher value like 4 for more clarity
        / length(max(p, p / vec2(2.0, cloud))) / 1e4;

    ///Shift position for each particle:
    //Frequencies to distribute particles x and y independently
    //i*i is a quick way to hide the sine wave periods
    //t to shift with time and p.x for leaving trails as it moves
    p += .02 * cos(i * (C.xz + 8. + i) + T + T);
  }

  //Add sky background and "tanh" tonemap
  O = tanh(p.x * vec4(0.0, 1.0, 2.0, -1.0) + S * S);
}
