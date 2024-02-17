#version 300 es

#include sdf.glsl;

#define M_PI 3.1415926535897932384626433832795

precision mediump float;

uniform vec2 screenResolution;
uniform float time;

out vec4 fragColor;

float repeatedSdf(vec3 p) {
  vec3 s = vec3(10.);
  vec3 r = p - s * roundVec3(p/s);
  r = vec3(r.x, r.y, p.z);
  return sdSphere(r, .75);
}

float sdCylinderCross(vec3 p, float rad) {
  vec2 origin = vec2(0., 0.);
  float cylinder1 = sdCylinder(p, vec3(origin.x, origin.y, rad));
  float cylinder2 = sdCylinder(rotateX(1.) * p, vec3(origin.x, origin.y, rad));
  float cylinder3 = sdCylinder(rotateZ(1.) * p, vec3(origin.x, origin.y, rad));
  return min(min(cylinder1, cylinder2), cylinder3);
}

float sdRecursiveShape(vec3 p) {
  float cross = sdCylinderCross(p, 1.);
  float box = sdBox(p, vec3(1., 1., 1.)) - .1;
  return min(box, cross);
}

float sdRecursiveShape2(vec3 p) {
  vec3 q = p;
  float r = 1e20;
  for (int i = 1; i <= 20; i++) {
    float s = 1. / float(i);
    float box = sdBox(q, vec3(s)) - .1 * s;
    float rot = sin(float(i) * M_PI * .15);
    r = min(box, r);
    q = q - s * normalize(
        rotateX(rot)
      * rotateY(rot)
      * rotateZ(rot)
      * vec3(0., 1., 0.));
  }
  return r;
}

// distance to the scene
float map(vec3 p) {
  // float ground = sdPlane(p, vec3(0., 1., 0.), 1.);
  // float obj1 = sdRecursiveShape(p - vec3(2., -2., 10.));
  float obj2 = sdRecursiveShape2(p - vec3(2., -2., 2.));
  return obj2;
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
  col = (phong + ambient) * la * is;
  //col = vec3(t * .2);

  fragColor = vec4(col, 1);
}

