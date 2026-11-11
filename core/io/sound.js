import config, { assets } from '/config.js'
import { randomInRange } from '/core/utils.js'

/** A volume around the game volume, so that repeated shots and blows do not all sound the same. */
export const randomVolume = () => randomInRange(config.volume * 0.5, config.volume * 1.25)

/** An Audio element for a file in /assets/sounds, at the game volume times `volume`, or at a random volume. */
export function createSound(file, { volume = 1, random = false } = {}) {
  const audio = new Audio(`${assets.sounds}${file}`)
  audio.volume = random ? randomVolume() : config.volume * volume
  return audio
}
