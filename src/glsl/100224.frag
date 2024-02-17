#version 300 es

precision highp float;

uniform vec2 screenResolution;
uniform float time;

out vec4 fragColor;

#include prng.glsl;

float fbm(vec2 x, float H) {
  float t = 0.;
  for(int i = 0; i < 10; i++) {
    float f = pow(2., float(i));
    float a = pow(f, -H);
    t += a * voronoi2(f * x);
  }
  return t;
}

vec3 fbm2(vec2 x, float H) {
  int numOctaves = 10;
  vec3 t = vec3(0.);
  for(int i = 0; i < numOctaves; i++) {
    float f = pow(2., float(i));
    float a = pow(f, -H);
    vec3 coloring = mix(
      vec3(.0982, .316, .5859),
      vec3(.3227, .3324, .3449),
      float(i) / float(numOctaves - 1)
    );
    t += a * voronoi2(f * x) * coloring;
  }
  return t;
}

float fbm3(vec2 x, float H) {
  float G = exp2(-H);
  float f = 1.;
  float a = 1.;
  float t = 0.;
  for(int i = 0; i < 8; i++) {
    t += a * voronoi2(f * x);
    f *= 2.;
    a *= G;
  }
  return t;
}

void main() {
  vec2 uv = gl_FragCoord.xy / screenResolution;
  vec3 col = vec3(0.);

  col = vec3(fbm2(uv, 0.3)) / 4.;

  fragColor = vec4(col, 1.);
}

