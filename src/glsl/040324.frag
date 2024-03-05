#version 300 es
#define M_PI 3.1415926535897932384626433832795

precision highp float;

uniform vec2 screenResolution;
uniform float time;

out vec4 fragColor;

// https://www.scratchapixel.com/lessons/3d-basic-rendering/volume-rendering-for-developers

#include prng.glsl;

// Henyey-Greenstein phase function (for in-scattering)
float phase(float g, float cosTheta) {
  float denom = 1. + g * g - 2. * g * cosTheta;
  return 1. / (4. * M_PI) * (1. - g * g) / (denom * sqrt(denom));
}

float fbm3(vec3 x, float H) {
  float G = exp2(-H);
  float f = 1.;
  float a = 1.;
  float t = 0.;
  for(int i = 0; i < 4; i++) {
    t += a * voronoi3(f * x);
    f *= 2.;
    a *= G;
  }
  return t;
}

float vdf(vec3 p) {
  p.z += time * 10.;
  //return voronoi3(p * .001);
  return fbm3(p * .0004, .6) * pow(voronoi3(p * .0001), 2.);
}

vec3 marchClouds(vec2 uv) {
  vec3 skyColor = vec3(.27, .33, .39);
  float maxLightTravel = 64e3;
  float fov = 1.;
  int stepCount = 4;

  float cloudMinY = 3e3;
  float cloudMaxY = 6e3;
  float sigma_a = .000064;
  float sigma_s = .00032;
  float sigma_t = sigma_a + sigma_s;
  float phaseAsymmetry = .8;
  int inScatteringTransmissionStepCount = 2;

  vec3 lightDirection = normalize(vec3(.5, -1., -.1));
  vec3 lightColor = vec3(12.);

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
  vec3 totalInScattering = vec3(0.);
  vec3 transmission = vec3(1.);

  // offset by stepSize/2
  for (float t = t0 + (stepSize / 2.); t < t1; t += stepSize) {
    p = ro + rd * t;

    float density = vdf(p);
    transmission *= exp(-stepSize * density * sigma_t);

    // inscattering
    float inScatteringTransmission = 1.;
    float inScatteringDistance = (cloudMaxY - p.y) / (-lightDirection.y);
    float inScatteringStepSize = inScatteringDistance / float(inScatteringTransmissionStepCount);
    for (float t2 = inScatteringStepSize / 2.; t2 < inScatteringDistance; t2 += inScatteringStepSize) {
      inScatteringTransmission *= exp(-vdf(p + t2 * (-lightDirection)) * inScatteringStepSize * sigma_t);
    }

    float cosTheta = dot(rd, (-lightDirection));
    totalInScattering += lightColor * transmission * inScatteringTransmission * sigma_s * phase(phaseAsymmetry, cosTheta) * density * stepSize;

    if (length(transmission) < .001) {
      break;
    }
  }

  vec3 col = skyColor * transmission + totalInScattering;

  col = mix(col, skyColor, exp2(t1 / maxLightTravel) - 1.);

  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2. - screenResolution.xy) / screenResolution.y;

  fragColor = vec4(marchClouds(uv), 1.);
}

