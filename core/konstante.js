export const KRUZNICA = Math.PI * 2

/** Per-frame values in the games, such as thrust and friction, are tuned at this frame rate. */
export const FPS = 60

/** How many frames at FPS a frame of length dt is worth. */
export const frames = dt => dt * FPS

export const ishodista = Object.freeze({
  centar: 'CENTAR',
  goreLevo: 'GORE_LEVO',
  doleDesno: 'DOLE_DESNO',
})
