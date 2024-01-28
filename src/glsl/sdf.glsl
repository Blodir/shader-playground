precision mediump float;

// https://iquilezles.org/articles/distfunctions/

float sdSphere(vec3 p, float s) {
  return length(p) - s;
}

// n must be normalized
float sdPlane(vec3 p, vec3 n, float h) {
  return dot(p,n) + h;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// not exact
float sdOctahedronNe(vec3 p, float s) {
  p = abs(p);
  return (p.x+p.y+p.z-s)*0.57735027;
}

float opUnion(float d1, float d2) {
  return min(d1, d2);
}

float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
  return mix(d2, d1, h) - k*h*(1.0-h);
}

float opSubtraction(float d1, float d2) {
  return max(-d1, d2);
}

float opSmoothSubtraction(float d1, float d2, float k) {
  float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
  return mix( d2, -d1, h ) + k*h*(1.0-h);
}

float sphereRad1(vec3 p) {
  return sdSphere(p, 1.);
}

float myRound(float value) {
  return floor(value + .5);
}

vec3 roundVec3(vec3 v) {
  return vec3(myRound(v.x), myRound(v.y), myRound(v.z));
}

