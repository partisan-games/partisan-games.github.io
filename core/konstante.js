export const KRUZNICA = Math.PI * 2

/**
 * Per-frame values in the games, such as thrust and friction, are tuned at this frame rate:
 * the games were made on a machine that ran at 30 frames per second. A game tuned on a faster
 * screen names its own rate (vis: 60).
 */
export const FPS = 30

/** How many frames at `fps` a frame of length dt is worth. */
export const frames = (dt, fps = FPS) => dt * fps

export const ishodista = Object.freeze({
  centar: 'CENTAR',
  goreLevo: 'GORE_LEVO',
  doleDesno: 'DOLE_DESNO',
})
