/** The Italian rifleman shares the skirmisher's 88 × 80 display size; the sheet retains detail at 5×. */
const italianRifleman = {
  src: 'game-ready/vojnici/italijanski-strelac-sprites.webp',
  names: ['idle', 'fire', 'hit', 'dead'],
  columns: 4,
  durations: { idle: 1.4, fire: .4, dead: .8 },
  width: 440, height: 400, gutter: 4,
  baseline: .85,
  muzzle: { x: 356, y: 175 },
  defaultAnimation: 'idle',
}

// The hit row already has the same dimensions and ground registration as idle.
const hitBounds = [0, 0, italianRifleman.width, italianRifleman.height]
export const italianRiflemanHit = {
  ...italianRifleman,
  bounds: hitBounds, referenceBounds: hitBounds,
  referenceSize: [italianRifleman.width, italianRifleman.height],
  clips: { hit: { row: 2, ms: [70, 80, 90, 80] } },
}

/** Measurements of the art, kept by hand. */
export default {
  italianRifleman,
  'partisanCrew': {
    'src': 'game-ready/artiljerija/partizanska-posada-sprites.webp',
    'names': [
      'idle',
      'load',
      'fire',
      'recoil'
    ],
    'columns': 4,
    'durations': {
      'idle': 1.4,
      'load': 0.75,
      'fire': 0.32,
      'recoil': 0.55
    },
    'width': 60,
    'height': 60,
    'baseline': 0.965,
    'footOffset': 26,
    'defaultAnimation': 'idle'
  },
  'italianCrew': {
    'src': 'game-ready/artiljerija/italijanska-posada-sprites.webp',
    'names': [
      'idle',
      'load',
      'fire',
      'recoil'
    ],
    'columns': 4,
    'durations': {
      'idle': 1.4,
      'load': 0.75,
      'fire': 0.32,
      'recoil': 0.55
    },
    'width': 60,
    'height': 60,
    'baseline': 0.965,
    'footOffset': 26,
    'defaultAnimation': 'idle'
  },
  'rifleman': {
    'src': 'game-ready/vojnici/partizanski-strelac-sprites.webp',
    'names': [
      'idle',
      'fire'
    ],
    'columns': 4,
    'durations': {
      'idle': 1.4,
      'fire': 0.4
    },
    'width': 88,
    'height': 80,
    'baseline': 0.85,
    'footOffset': 26,
    'defaultAnimation': 'idle'
  },
  'partisanBearer': {
    'src': 'game-ready/vojnici/partizanski-zastavnik-sprites-redraw.webp',
    'names': [
      'partisan'
    ],
    'columns': 4,
    'durations': {
      'partisan': 1.6
    },
    'width': 60,
    'height': 80,
    'baseline': 0.95,
    'footOffset': 35,
    'defaultAnimation': 'partisan'
  },
  'italianBearer': {
    'src': 'game-ready/vojnici/zastavnici-sprites.webp',
    'names': [
      'partisan',
      'italian'
    ],
    'columns': 4,
    'durations': {
      'partisan': 1.6,
      'italian': 1.6
    },
    'width': 80,
    'height': 80,
    'baseline': 0.95,
    'footOffset': 35,
    'defaultAnimation': 'italian'
  }
}
