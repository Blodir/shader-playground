#version 300 es
#define M_PI 3.1415926535897932384626433832795
precision mediump float;

uniform vec2 screenResolution;
uniform float time;

out vec4 fragColor;

vec3 sines1(vec2 uv) {
  vec3 col = vec3(0.,0.,0.);

  float amplitude = .5;
  float freq = 2.;
  float y = amplitude * sin(freq * uv.x * M_PI);
  y += .25 * sin(4.5943 * uv.x * M_PI);
  y += .125 * sin(9.9345 * uv.x * M_PI);

  if (abs(uv.y - y) <= .005) {
    col += vec3(1.);
  }

  return col;
}

vec3 origin(vec2 uv) {
  vec3 col = vec3(0.,0.,0.);
  if (distance(uv.xy, vec2(0.,0.)) <= .01) {
    col = vec3(1.,0.,0.);
  }
  return col;
}

vec3 sines2(vec2 uv) {
  vec3 col = vec3(0.,0.,0.);
  float amp = .5;
  float freq = 2.;
  float spread = .1;
  col += pow(abs(uv.y - amp * sin(freq * uv.x * M_PI)), spread);
  return col;
}

#include prng.glsl;

void main() {
  //vec2 uv = (gl_FragCoord.xy * 2. - screenResolution.xy) / screenResolution.y;
  vec2 uv = gl_FragCoord.xy / screenResolution;
  vec3 col = vec3(0.,0.,0.);

  // col += sines1(uv);
  // col += origin(uv);
  // col += sines2(uv);
  // float noise = rand(uv);
  col += nPerlin2(uv * 2.) * .8;
  col += nPerlin2(uv * 4.) * .4;
  col += nPerlin2(uv * 8.) * .2;
  col += nPerlin2(uv * 16.) * .1;
  col += nPerlin2(uv * 32.) * .05;
  col += nPerlin2(uv * 64.) * .025;

  fragColor = vec4(col, 1.);
}

