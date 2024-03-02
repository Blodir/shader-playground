precision highp float;

// Simple pseudorandom number generator given by chatgpt
float rand(vec2 uv){
  highp float a = 12.9898, b = 78.233, c = 43758.5453;
  highp float dt = dot(uv.xy ,vec2(a, b)), sn = mod(dt, 3.14);
  return fract(sin(sn) * c);
}

// ------------ //
// Perlin noise //
// ------------ //

// https://adrianb.io/2014/08/09/perlinnoise.html

float perlin3(vec3 p) {
  vec3 fr = fract(p);
  return 0.;
}

// https://www.youtube.com/watch?v=7fd331zsie0

float distFromLineSegment(vec2 p, vec2 a, vec2 dir) {
  vec2 b = a + dir;
  vec2 ab = b - a;
  vec2 ap = p - a;
  float t = dot(ap, ab) / dot(ab, ab);
  vec2 closest = t < 0. ? a : (t > 1. ? b : a + t*ab);
  return distance(p, closest);
}

vec2 randomGradient(vec2 p) {
  float x = dot(p, vec2(123.4, 234.5));
  float y = dot(p, vec2(234.5, 345.6));
  vec2 gradient = vec2(x, y);
  gradient = sin(gradient);
  gradient = gradient * 65943.;
  gradient = sin(gradient);
  return gradient;
}

vec3 randomGradient3(vec3 p) {
  float x = dot(p, vec3(123.4, 234.5, 345.6));
  float y = dot(p, vec3(234.5, 345.6, 456.7));
  float z = dot(p, vec3(345.6, 456.7, 567.8));
  vec3 gradient = vec3(x, y, z);
  gradient = sin(gradient);
  gradient = gradient * 65943.;
  gradient = sin(gradient);
  return gradient;
}

float perlin2(vec2 p) {
  vec2 fl = floor(p);
  vec2 fr = fract(p);

  vec2 bl = fl + vec2(0., 0.);
  vec2 br = fl + vec2(1., 0.);
  vec2 tl = fl + vec2(0., 1.);
  vec2 tr = fl + vec2(1., 1.);

  vec2 gradBl = randomGradient(bl);
  vec2 gradBr = randomGradient(br);
  vec2 gradTl = randomGradient(tl);
  vec2 gradTr = randomGradient(tr);

  vec2 distBl = fr - vec2(0., 0.);
  vec2 distBr = fr - vec2(1., 0.);
  vec2 distTl = fr - vec2(0., 1.);
  vec2 distTr = fr - vec2(1., 1.);

  float dotBl = dot(gradBl, distBl);
  float dotBr = dot(gradBr, distBr);
  float dotTl = dot(gradTl, distTl);
  float dotTr = dot(gradTr, distTr);

  fr = smoothstep(0., 1., fr);

  float b = mix(dotBl, dotBr, fr.x);
  float t = mix(dotTl, dotTr, fr.x);
  float perlin = mix(b, t, fr.y);
  return perlin;
}

// normalized perlin to range [0..1]
float nPerlin2(vec2 p) {
  return (perlin2(p) + 1.) / 2.;
}


// ------------  //
// Voronoi noise //
// ------------  //

float voronoi2(vec2 p) {
  vec2 fl = floor(p);
  vec2 fr = fract(p);
  vec2 q = fr - .5;

  float minDist = 100.;
  for (float i = -1.; i <= 1.; i++) {
    for (float j = -1.; j <= 1.; j++) {
      vec2 neighborCell = vec2(i, j);
      vec2 noise = randomGradient(fl + neighborCell);
      vec2 pointOnNeighbor = neighborCell + noise * .5;
      float d = distance(q, pointOnNeighbor);
      minDist = min(d, minDist);
    }
  }
  return minDist;
}

float voronoi3(vec3 p) {
  vec3 fl = floor(p);
  vec3 fr = fract(p);
  vec3 q = fr - .5;

  float minDist = 100.;
  for (float i = -1.; i <= 1.; i++) {
    for (float j = -1.; j <= 1.; j++) {
      for (float k = -1.; k <= 1.; k++) {
        vec3 neighborCell = vec3(i, j, k);
        vec3 noise = randomGradient3(fl + neighborCell);
        vec3 pointOnNeighbor = neighborCell + noise * .5;
        float d = distance(q, pointOnNeighbor);
        minDist = min(d, minDist);
      }
    }
  }
  return minDist;
}


