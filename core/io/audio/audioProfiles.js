const fromDecibels = decibels => 10 ** (decibels / 20)

/** Real loudness at the speaker (recording RMS times every gain), in dBFS, below which a voice does not start. */
const audibleFrom = -45

/**
 * Application-wide native voice caps. `enter`/`leave` are the levels below which a voice is not played:
 * a silent voice starts above −45 dBFS and keeps playing until −48 dBFS. `fade` is in seconds.
 */
export const voiceLimits = Object.freeze({
  total: 16, loops: 4, reserved: 2, enter: fromDecibels(audibleFrom), leave: fromDecibels(audibleFrom - 3), fade: .008,
})

/**
 * 2D on-screen mix. Between the player and the farthest screen corner, distance lowers a source by `span` dB.
 * A source quieter than `nearLevel` next to the player is raised to it, so the far corner is still at `floorLevel`,
 * 1 dB above the start threshold: everything on screen is heard. A steady sound that stays with the player is raised
 * only to `floorLevel` where it is, so a monotonous hum does not tire the ear.
 * Off screen a source fades out within `edgeFade` of the screen diagonal.
 */
const screenSpan = 10
export const screenMix = Object.freeze({
  span: screenSpan, floorLevel: fromDecibels(audibleFrom + 1), nearLevel: fromDecibels(audibleFrom + 1 + screenSpan), edgeFade: .1,
})

export const audioGroups = Object.freeze({ effects: .8, engines: .65, ambience: .5, speech: .9, music: .45, ui: .7 })
export const mixHeadroom = .7

const groupPriorities = { effects: 50, engines: 40, ambience: 10, speech: 90, music: 20, ui: 100 }
const criticalGroups = new Set(['speech', 'ui'])
const fixedPitchGroups = new Set(['speech', 'music', 'ui'])

const defaults = {
  group: 'effects', trim: 1, panWidth: 1,
  nearCutoff: 18000, farCutoff: 1800,
  doppler: false, soundSpeed: 34.3, minRate: .9, maxRate: 1.1,
  pitchRange: [1, 1], volumeRange: [1, 1],
  priority: 50, critical: false, outputInterval: 0,
  budgetKey: 'effects', maxVoices: voiceLimits.total,
}

const definitions = {
  effects: {},
  rifle: { nearDistance: 1, fadeStart: 18, maxDistance: 25, pitchRange: [.98, 1.02], volumeRange: [.95, 1], maxVoices: 6 },
  footstep: { nearDistance: .7, fadeStart: 6, maxDistance: 12, priority: 20, maxVoices: 4 },
  impact: { nearDistance: 1, fadeStart: 8, maxDistance: 14, priority: 35, maxVoices: 4 },
  cannon: { nearDistance: 2, fadeStart: 50, maxDistance: 70, farCutoff: 700, volumeRange: [.95, 1], maxVoices: 4 },
  explosion: { nearDistance: 2, fadeStart: 50, maxDistance: 70, farCutoff: 500, volumeRange: [.95, 1], maxVoices: 4 },
  flight: { nearDistance: .75, fadeStart: 18, maxDistance: 25, doppler: true, farCutoff: 1200, maxVoices: 4 },
  engine: { group: 'engines', nearDistance: 2, fadeStart: 32, maxDistance: 45, doppler: true, farCutoff: 1000, maxVoices: 4 },
  fire: { group: 'ambience', nearDistance: 4, fadeStart: 28, maxDistance: 40, panWidth: .55, farCutoff: 1200, outputInterval: .1, maxVoices: 2 },
  water: { group: 'ambience', nearDistance: 1, fadeStart: 20, maxDistance: 30, panWidth: .55, outputInterval: .1, maxVoices: 2 },
  speech: { group: 'speech', nearDistance: 1, fadeStart: 8, maxDistance: 12, farCutoff: 2500, maxVoices: 2 },
  ambience: { group: 'ambience', outputInterval: .1 },
  music: { group: 'music', maxVoices: 1 },
  ui: { group: 'ui', maxVoices: 4 },
}

const between = (min, max) => value => Number.isFinite(value) && value >= min && value <= max
const isBoolean = value => typeof value === 'boolean'
const range = (min, max) => value => Array.isArray(value) && value.length === 2
  && value.every(between(min, max)) && value[0] <= value[1]

const profileRules = {
  trim: between(0, 2),
  panWidth: between(0, 1),
  nearCutoff: between(20, 20000),
  farCutoff: between(20, 20000),
  doppler: isBoolean,
  soundSpeed: value => Number.isFinite(value) && value > 0,
  minRate: between(.9, 1),
  maxRate: between(1, 1.1),
  pitchRange: range(.9, 1.1),
  volumeRange: range(0, 1),
  priority: between(0, 100),
  critical: isBoolean,
  outputInterval: between(0, .1),
  budgetKey: value => typeof value === 'string' && value.trim() !== '',
  maxVoices: value => Number.isInteger(value) && value >= 1 && value <= voiceLimits.total,
}

function validate(profile) {
  for (const [key, valid] of Object.entries(profileRules))
    if (!valid(profile[key])) throw new RangeError(`Invalid audio profile value: ${key}`)
  if (profile.nearCutoff < profile.farCutoff) throw new RangeError('Invalid audio profile value: nearCutoff is below farCutoff')
  if (fixedPitchGroups.has(profile.group) && (profile.doppler || profile.pitchRange[0] !== 1 || profile.pitchRange[1] !== 1))
    throw new RangeError('Speech, music and UI must retain their pitch')
}

const resolvedProfiles = new WeakSet()
const namedProfiles = new Map()

/** Names are conveniences, not an exhaustive list of supported emitters; custom profiles are plain data. */
export function resolveAudioProfile(requested, { stream = false } = {}) {
  const profile = requested ?? (stream ? 'music' : 'effects')
  if (typeof profile === 'string') {
    if (namedProfiles.has(profile)) return namedProfiles.get(profile)
    if (!Object.hasOwn(definitions, profile)) throw new TypeError('Unknown audio profile')
  } else if (typeof profile !== 'object' || Array.isArray(profile)) throw new TypeError('Invalid audio profile')
  else if (resolvedProfiles.has(profile)) return profile

  const named = typeof profile === 'string'
  const definition = named ? definitions[profile] : profile
  const result = { ...defaults, ...definition }
  if (!Object.hasOwn(audioGroups, result.group)) throw new TypeError('Unknown audio mix group')
  result.priority = definition.priority ?? groupPriorities[result.group]
  result.budgetKey = definition.budgetKey ?? (named ? profile : result.group)
  result.critical = result.critical || criticalGroups.has(result.group)
  validate(result)
  result.pitchRange = Object.freeze([...result.pitchRange])
  result.volumeRange = Object.freeze([...result.volumeRange])
  Object.freeze(result)
  resolvedProfiles.add(result)
  if (named) namedProfiles.set(profile, result)
  return result
}

export const audioProfiles = Object.freeze(Object.fromEntries(Object.keys(definitions).map(name => [name, resolveAudioProfile(name)])))

/** Separate deterministic stream: audio variation never consumes gameplay Math.random(). */
export function createAudioRandom(seed = 0x6d2b79f5) {
  let state = seed >>> 0 || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }
}

export const sampleAudioRange = (random, [min, max]) => min === max ? min : min + (max - min) * random()

export function distanceCutoff(profile, ratio) {
  const near = profile.nearCutoff ?? defaults.nearCutoff
  const far = profile.farCutoff ?? defaults.farCutoff
  return near * (far / near) ** Math.max(0, Math.min(1, ratio))
}
