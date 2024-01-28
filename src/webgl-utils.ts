export const createShader = (gl: WebGLRenderingContext, source: string, type: number): WebGLShader => {
  const shader = gl.createShader(type);
  if (shader === null) { throw new Error('Could not create webgl shader.'); }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    throw new Error('could not compile shader:' + gl.getShaderInfoLog(shader));
  }
  return shader;
};

export const createProgram = (gl: WebGLRenderingContext, vertex: WebGLShader, fragment: WebGLShader): WebGLProgram => {
  const program = gl.createProgram();
  if (program === null) { throw new Error('Could not create webgl program.'); }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
      throw new Error('Webgl program failed to link:' + gl.getProgramInfoLog (program));
  }
  return program;
};

