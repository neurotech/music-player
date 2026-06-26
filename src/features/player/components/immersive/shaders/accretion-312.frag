/*
    "Accretion" by @XorDev

    I discovered an interesting refraction effect
    by adding the raymarch iterator to the turbulence!
    https://x.com/XorDev/status/1936884244128661986
*/

void mainImage(out vec4 O, vec2 I)
{
  //Raymarch depth
  float z = 0.0,
  //Step distance
  d = 0.0,
  //Raymarch iterator
  i = 0.0;
  O = vec4(0.0);
  //Clear fragColor and raymarch 20 steps
  for (int rayStep = 1; rayStep <= 20; rayStep++)
  {
    i = float(rayStep);
    //Sample point (from ray direction)
    vec3 p = z * normalize(vec3(I + I, 0.0) - iResolution.xyx) + .1;

    //Polar coordinates and additional transformations
    p = vec3(atan(p.y / .2, p.x) * 2., p.z / 3., length(p.xy) - 5. - z * .2);

    //Apply turbulence and refraction effect
    for (int turbulenceStep = 1; turbulenceStep <= 7; turbulenceStep++)
    {
      d = float(turbulenceStep);
      p += sin(p.yzx * d + iTime + .3 * i) / d;
    }

    //Distance to cylinder and waves with refraction
    z += d = length(vec4(.4 * cos(p) - .4, p.z));

    //Coloring and brightness
    O += (1. + cos(p.x + i * .4 + z + vec4(6.0, 1.0, 2.0, 0.0))) / d;
  }
  //Tanh tonemap
  O = tanh(O * O / 4e2);
}
