#version 300 es

precision highp float;

uniform vec2 screenResolution;
uniform float time;

out vec4 fragColor;

#include sdf.glsl;
#include prng.glsl;

float map(vec3 p) {
  float ground = sdPlane(p, normalize(vec3(0., 1., 0.)), 15.);
  float perlin = 0.;
  perlin += 8. * nPerlin2(p.xz * .02);
  perlin += 6. * nPerlin2(p.xz * .04);
  perlin += 4. * nPerlin2(p.xz * .08);
  perlin += 2. * nPerlin2(p.xz * .16);
  perlin += 1. * nPerlin2(p.xz * .32);
  perlin += .5 * nPerlin2(p.xz * .64);
  perlin += .25 * nPerlin2(p.xz * 1.28);
  perlin += .125 * nPerlin2(p.xz * 2.56);
  return ground - perlin;
}

#include ray-marching.glsl;

void main() {
  vec2 uv = (gl_FragCoord.xy * 2. - screenResolution.xy) / screenResolution.y;
  float cutoff = 400.;

  vec3 ro = vec3(0., 0., -3.);
  vec3 rd = normalize(vec3(uv, 1.));
  vec3 col = vec3(0.);

  float t = 0.;

  vec3 p;

  for (int i = 0; i < 80; i++) {
    p = ro + rd * t;
    float d = map(p);
    t += d;
    if (d < .001 || t > cutoff) break;
  }

  vec3 n = getFDNormal(p);
  float la = (cutoff - t) / cutoff;
  vec3 ld = normalize(vec3(-1., 1., -1.));
  vec3 lc = vec3(.8, .8, .8);
  vec3 ambient = vec3(.05);
  vec3 phong = clamp(dot(n, ld), 0., 1.) * lc;
  float is = softShadowImproved(p, ld, .5, 100., 0.2);
  col = (phong + ambient) * la * is * vec3(.0982, .316, .5859);

  fragColor = vec4(col, 1.);
}
