#version 300 es

precision highp float;

uniform vec2 screenResolution;
uniform float time;

out vec4 fragColor;

// https://www.scratchapixel.com/lessons/3d-basic-rendering/volume-rendering-for-developers

#include prng.glsl;

float fbm2(vec2 x, float H) {
  float G = exp2(-H);
  float f = 1.;
  float a = 1.;
  float t = 0.;
  for(int i = 0; i < 8; i++) {
    t += a * perlin2(f * x);
    f *= 2.;
    a *= G;
  }
  return t;
}

float fbm3(vec3 x, float H) {
  float G = exp2(-H);
  float f = 1.;
  float a = 1.;
  float t = 0.;
  for(int i = 0; i < 8; i++) {
    t += a * voronoi3(f * x);
    f *= 2.;
    a *= G;
  }
  return t;
}

float map(vec3 p) {
  float displacement = fbm2(p.xz / 32., .8);
  float waterSurface = p.y - displacement;
  return waterSurface;
  //return voronoi3(p);
}

// returns the distance to a volume
float volumeMap(vec3 p) {
  // if p.y in [3km..12km]
  // we are on the cloud layer and should do volumetric calculations
  return 1000. - p.y; // clouds
}

#include ray-marching.glsl;

// volume density field
float vdf(vec3 p) {
  return fbm3(p * .0004, .6);
}

float beerLambertTransmittance(float dist, float sigma) {
  return exp(-dist * sigma);
}

float vdf2(vec3 p) {
  //return voronoi3(p * .001);
  return fbm3(p * .0004, .5);
}

vec3 skyColor = vec3(.27, .33, .39);

vec3 marchClouds(vec2 uv) {
  float cloudMinY = 3e3;
  float cloudMaxY = 12e3;
  float maxLightTravel = 64e3;
  float fov = 1.;
  int stepCount = 8;

  vec3 lightDirection = normalize(vec3(0., -1., 0.));
  vec3 lightColor = vec3(1.);

  vec3 ro = vec3(0., 0., -3.);
  vec3 rd = normalize(vec3(uv, fov));
  vec3 p;

  // ignore rays that can't possibly hit the cloud layer
  // ignore rays originating from within the cloud layer (should not be allowed)
  if (rd.y <= 0. || ro.y + rd.y >= cloudMinY) {
    return skyColor;
  }

  float t0 = (cloudMinY - ro.y) / rd.y; // distance that the ray has to travel to reach lower boundary of cloud layer
  float t1 = (cloudMaxY - ro.y) / rd.y;

  // ignore rays that have to travel more than maxLightTravel to reach the end of the cloud layer
  if (t1 >= maxLightTravel) {
    return skyColor;
  }

  float stepSize = (t1 - t0) / float(stepCount); // distance covered by one ray marching step
  vec3 result = vec3(0.);
  vec3 transmission = vec3(1.);

  for (float t = t0; t < t1; t += stepSize) {
    p = ro + rd * t;

    // accumulate volumetric effects
    vec3 absorption = vec3(.00014);
    float density = vdf2(p);

    // how much light is scattered toward ro
    float p1 = (cloudMaxY - p.y) / (-lightDirection.y);
    vec3 scattered = lightColor * exp(-p1 * absorption) * .0002;

    // how much light coming from behind is obstructed
    transmission *= exp(-stepSize * absorption * density);
    
    result += scattered * transmission * stepSize * density;

    if (transmission.x + transmission.y + transmission.z < .01) {
      break;
    }
  }

  vec3 col = skyColor * transmission + result;

  col = mix(col, skyColor, exp2(t1 / maxLightTravel) - 1.);

  return col;
}

vec3 march1(vec2 uv) {
  float cutoff = 5000.;

  vec3 ro = vec3(0., 5., -3.);
  vec3 rd = normalize(vec3(uv, 1.));
  vec3 col = vec3(0.);

  float t = 0.;
  vec3 p;
  bool inVolume = false;
  vec3 volumeMask = vec3(1.);

  for (int i = 0; i < 80; i++) {
    p = ro + rd * t;

    float vm = volumeMap(p);
    inVolume = vm < 0.;
    
    float d = 1.;
    if (inVolume) {
      // accumulate volume mask

      // how much light is scattered in this direction
      float psd = 1000.; // TODO ray from p to sun distance travelled in the volume
      float averageDensity = .5; // TODO
      float absorptionCoeff = .02; // TODO
      float scattered = beerLambertTransmittance(psd, absorptionCoeff * averageDensity);

      // how much light coming from behind is obstructed
      float T = beerLambertTransmittance(d, absorptionCoeff * vdf(p));

      volumeMask = (volumeMask + scattered) * T;
      //volumeMask = volumeMask * T;
    } else {
      d = max(min(map(p), vm), .001); // minimum increment
    }
    t += d;

    if (d < .001 || t > cutoff) break;
  }

  vec3 n = getFDNormal(p);
  vec3 ld = normalize(vec3(-1., 1., -1.));
  vec3 lc = vec3(.8, .8, .8);
  vec3 phong = t > cutoff ? skyColor : clamp(dot(n, ld), 0., 1.) * lc;
  float is = softShadowImproved(p, ld, .5, 100., 0.2);
  col = mix(skyColor, phong * is * volumeMask, beerLambertTransmittance(t, .001));
  
  // testing:
  col = volumeMask;
  //col = vec3(float(temp) / 80.);
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2. - screenResolution.xy) / screenResolution.y;

  fragColor = vec4(marchClouds(uv), 1.);
  //fragColor = vec4(march1(uv), 1.);
  //fragColor = vec4(0., 0., 0., 1.);
  return;
}

