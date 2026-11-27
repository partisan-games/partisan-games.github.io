/** Shared meanings only; consumers own markup, sizing and accessible labels. */
export const icons = Object.freeze({
  jump: '↑',
  attack: '🗡️',
  attack2: '⚔️',
  special: '💥',
  shoot: '💥',
  unarmed: '👊',
  magic: '✨',
  bomb: '💣',
  rocket: '🚀',
  life: '❤️',
  loop: '➰',
  fuel: '⛽',
  start: '🔥',
  continue: '🔥',
  menu: '☰',
  sneak: '🐾',
  take: '✋',
  replay: '↻',
  settings: '⚙️',
  back: '←',
  defeat: '☠️',
  victory: '🎖️',
})

/** Paths are relative to the image root, independent of UI and game classes. */
export const iconImages = Object.freeze({
  ammunition: 'game-ready/projektili/granata.webp',
  coin: 'ui/coin.gif',
  coinStill: 'ui/coin-still.png',
  /** The one gun sight: in the middle of a first-person view, and the pointer where the player aims with the mouse. */
  sight: 'ui/crosshair.png',
})
