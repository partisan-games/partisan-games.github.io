import config from '/config.js'

const storageKey = 'partisan-games-settings'

/** Player settings shared by every game; `config` keeps the defaults and the current values. */
function read(storage) {
  try {
    return JSON.parse(storage?.getItem(storageKey)) ?? {}
  } catch {
    return {}
  }
}

function write(storage, settings) {
  try {
    storage?.setItem(storageKey, JSON.stringify(settings))
  } catch {
    // Private windows may refuse storage; the setting still applies until the page closes.
  }
}

const clampVolume = value => Math.max(0, Math.min(1, Number(value)))

/** Applies saved settings to `config` once, when the first game's UI loads. */
export function loadSettings(storage = globalThis.localStorage) {
  const { volume } = read(storage)
  if (volume != null && Number.isFinite(Number(volume))) config.volume = clampVolume(volume)
}

export function setVolume(value, storage = globalThis.localStorage) {
  if (!Number.isFinite(Number(value))) return
  config.volume = clampVolume(value)
  saveSetting('volume', config.volume, storage)
}

/** One saved setting, or undefined. */
export const readSetting = (key, storage = globalThis.localStorage) => read(storage)[key]

/** Saves one setting and keeps the others. */
export function saveSetting(key, value, storage = globalThis.localStorage) {
  write(storage, { ...read(storage), [key]: value })
}

loadSettings()
