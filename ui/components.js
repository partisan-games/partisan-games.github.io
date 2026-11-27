import { currentStyleClasses } from './styles.js'

/** The health bar of every game, with the `share` (0 to 1) of the health left, in a corner of the screen by `place`. */
export const healthBar = (share, place = '') => {
  const classes = ['progress', place, currentStyleClasses().healthBar].filter(Boolean).join(' ')
  return `<progress class="${classes}" value="${share * 100}" max="100"></progress>`
}
