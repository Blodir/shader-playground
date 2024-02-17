precision mediump float;

// Requires "map" function to be defined.

// -------------------- //
// Shadows              //
// -------------------- //

// https://iquilezles.org/articles/rmshadows/

// given ray origin ro (point to be checked), ray direction rd (reverse light direction)
// returns 0. if ro is in shadow in respect to rd, and 1. otherwise
// mint represents min travel distance to avoid self shadowing
// maxt represents max travel distance that the ray may travel before we consider it to not be in shadow
float shadow(in vec3 ro, in vec3 rd, float mint, float maxt) {
  float t = mint;
  for (int i = 0; i < 256 && t < maxt; i++) {
    float h = map(ro + rd*t);
    if (h < 0.001) {
      return 0.;
    }
    t += h;
  }
  return 1.;
}

// same as above, but with a penumbra
// k represents the softness of the penumbra (smaller is softer)
float softShadow(in vec3 ro, in vec3 rd, float mint, float maxt, float k) {
  float res = 1.;
  float t = mint;
  for (int i = 0; i < 256 && t < maxt; i++) {
    float h = map(ro + rd*t);
    if (h < 0.001) {
      return 0.;
    }
    res = min(res, k*h/t);
    t += h;
  }
  return res;
}

float softShadowImproved(in vec3 ro, in vec3 rd, float mint, float maxt, float w) {
  float res = 1.;
  float ph = 1e20;
  float t = mint;
  for (int i = 0; i < 256 && t < maxt; i++) {
    float h = map(ro + rd*t);
    if (h < 0.001) {
      return 0.;
    }
    float y = h*h / (2.*ph);
    float d = sqrt(h*h - y*y);
    res = min(res, d/(w*max(0., t-y)));
    ph = h;
    t += h;
  }
  return res;
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

