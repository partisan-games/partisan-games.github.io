import { duration } from './Battle.js'

const crossfade = 1.2
const hold = 4
const fadeOut = .8
export const promoDuration = duration + crossfade + hold + fadeOut

const smooth = value => {
  const clamped = Math.max(0, Math.min(1, value))
  return clamped * clamped * (3 - 2 * clamped)
}

/** Scene-owned timing: the march gives way to the brand before the next loop. */
export function promoAt(elapsed) {
  const time = Math.max(0, elapsed) % promoDuration
  return {
    battleTime: Math.min(time, duration),
    showBattle: time < duration + crossfade,
    logoOpacity: smooth((time - duration) / crossfade),
    fade: Math.max(1 - smooth(time / .25), smooth((time - (promoDuration - fadeOut)) / fadeOut)),
  }
}
