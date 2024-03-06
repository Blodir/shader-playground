import './style.css'
import { createProgram, createShader } from './webgl-utils';
import vertex from './glsl/main.vert';
import fragment from './glsl/040324.frag';

const init = () => {
  const canvas: HTMLCanvasElement | null = document.querySelector('#webgl-canvas');
  if (canvas === null) { throw new Error('Couldn\'t find canvas.'); }
  const gl: WebGL2RenderingContext | null = canvas.getContext('webgl2');
  if (gl === null) { throw new Error('Couldn\'t get webgl2 context.'); }

  // compile shader program
  const vs = createShader(gl, vertex, gl.VERTEX_SHADER);
  const fs = createShader(gl, fragment, gl.FRAGMENT_SHADER);
  const program = createProgram(gl, vs, fs);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.useProgram(program);

  // SCREEN RECT

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const positions = [
    1.0,  1.0,
   -1.0,  1.0,
    1.0, -1.0,
   -1.0, -1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  const vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);

  // SCREEN RESOLUTION
  const resolutionLocation = gl.getUniformLocation(program, 'screenResolution');
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

  const timeLocation = gl.getUniformLocation(program, 'time');

  const resizeObserver = new ResizeObserver(
    () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    }
  );
  resizeObserver.observe(canvas);

  const fpsElem = document.querySelector('#fps');
  let lastTimeStamp = performance.now();

  // render just once for now...
  //let count = 0;
  const f = (time: DOMHighResTimeStamp) => {
    gl.uniform1f(timeLocation, time);
    draw(gl)
    //if (count === 0) { requestAnimationFrame(f); count++; }
    const timeDiffSec = (time - lastTimeStamp) / 1000;
    lastTimeStamp = time;
    if (fpsElem) { fpsElem.innerHTML = `fps: ${Math.round(1 / timeDiffSec)}`; }

    requestAnimationFrame(f);
  };

  requestAnimationFrame(f);
}

const draw = (gl: WebGL2RenderingContext) => {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

init();

