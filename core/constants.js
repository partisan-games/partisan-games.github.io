/**
 * Per-frame values in the games, such as thrust and friction, are tuned at this frame rate:
 * the games were made on a machine that ran at 30 frames per second. A game tuned on a faster
 * screen names its own rate (vis: 60).
 */
export const FPS = 30

/** How many frames at `fps` a frame of length dt is worth. */
export const frames = (dt, fps = FPS) => dt * fps

export const origins = Object.freeze({
  center: 'CENTAR',
  topLeft: 'GORE_LEVO',
  bottomRight: 'DOLE_DESNO',
})

/** CSS skies a 3D view shows behind its transparent canvas. */
export const skyGradients = {
  svetla: 'linear-gradient(to bottom, #94c5f8 1%, #a6e6ff 70%, #b1b5ea 100%)',
  modra: 'linear-gradient(180deg, #0B3D91 0%, #000000 100%)',
  suton: 'linear-gradient(to bottom, #ff8a00 0%, yellow 100%)',
  mrkla: 'linear-gradient(to bottom, #020111 70%, #191621 100%)',
}
