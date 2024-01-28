#version 300 es

#include sdf.glsl;

#define M_PI 3.1415926535897932384626433832795

precision mediump float;

uniform vec2 screenResolution;
uniform float time;

out vec4 fragColor;

// distance to the scene
float map(vec3 p) {
  float obj1 = sdSphere(p, 1.);
  float obj2 = sdOctahedronNe(p - vec3(3. * sin(M_PI * .0005 * time), 0., 0.), 1.);
  return min(
    //opSmoothUnion(obj1, obj2, 1.),
    obj1,
    sdPlane(p, vec3(0., 1., 0.), 1.)
  );
}

// normal approximation based on finite difference method
// uses the map function SDF
vec3 getFDNormal(vec3 p) {
  float d = map(p);
  float epsilon = 0.001; // A small value
  vec2 e = vec2(epsilon, 0.0);

  // Gradient calculation using central difference
  vec3 normal = normalize(vec3(
    d - map(p - e.xyy),
    d - map(p - e.yxy),
    d - map(p - e.yyx)
  ));

  return normal;
}

#include ray-marching.glsl;

void main() {
  vec2 uv = (gl_FragCoord.xy * 2. - screenResolution.xy) / screenResolution.y;
  float fov = 1.; // field of view
  
  // initialize viewer
  vec3 ro = vec3(0, 0, -3);
  vec3 rd = normalize(vec3(uv * fov, 1));
  vec3 col = vec3(0); // pixel color

  float t = 0.; // total distance travelled

  vec3 p;

  // raymarching
  for (int i = 0; i < 80; i++) {
    p = ro + rd * t; // current position
    float d = map(p);     // current distance to the scene
    t += d;               // march the ray forward

    if (d < .001 || t > 100.) break;
  }

  vec3 n = getFDNormal(p);

  float la = (100. - t) / 100.; // light attenuation with distance from viewer
  vec3 ld = -normalize(vec3(1., -1., 1.)); // reverse light direction
  vec3 lc = vec3(.5, .5, .5); // light color
  vec3 ambient = vec3(.05); // ambient light
  vec3 phong = clamp(dot(n, ld), 0., 1.) * lc;
  float is = softShadowImproved(p, ld, .5, 100., 0.2); // point is in shadow
  //float is = 1.;
  col = (phong + ambient) * la * is;
  // col = vec3(t * .2);

  fragColor = vec4(col, 1);
}

