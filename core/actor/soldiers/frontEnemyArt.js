// Measurements of the art, kept by hand.
export const coveredMachineGunner = {
  src: 'game-ready/vojnici/otpisani-machine-gunner-pixel-sprites.webp',
  width: 192,
  height: 180,
  gutter: 4,
  anchor: { x: 72, y: 168 },
  standingPixels: 180,
  muzzle: [160, 70],
  targetPixels: { idle: 125, attack: 136 },
  clips: {
    crouch: { row: 0, frameColumns: [0], ms: [1000] },
    peek: { row: 0, frameColumns: [1], ms: [1000] },
  },
}

export const submachineGunner = {
  src: 'game-ready/vojnici/otpisani-submachine-gunner-pixel-sprites.webp',
  width: 192,
  height: 216,
  gutter: 4,
  anchor: { x: 96, y: 200 },
  standingPixels: 180,
  muzzle: [96, 70],
  clips: {
    idle: { row: 0, frameColumns: [0], ms: [1000] },
    attack: { row: 0, frameColumns: [1], ms: [1000] },
  },
}

export default {
  submachineGunner,
  machineGunner: {
    ...coveredMachineGunner,
    clips: {
      idle: coveredMachineGunner.clips.crouch,
      attack: coveredMachineGunner.clips.peek,
    },
  },
  'rifleman': {
    'src': 'game-ready/vojnici/otpisani-rifleman-pixel-sprites.webp',
    'width': 512,
    'height': 512,
    'gutter': 4,
    'anchor': {
      'x': 256,
      'y': 496
    },
    'standingPixels': 421,
    'effectStandingPixels': 194,
    'muzzle': [
      273.1165501165501,
      163.5081585081585
    ],
    'clips': {
      'idle': {
        'row': 0,
        'ms': [
          250,
          250,
          250,
          250
        ],
        'loop': true
      },
      'walk-left': {
        'row': 1,
        'ms': [
          180,
          180,
          180,
          180
        ],
        'loop': true
      },
      'walk-right': {
        'row': 2,
        'ms': [
          180,
          180,
          180,
          180
        ],
        'loop': true
      },
      'attack': {
        'row': 3,
        'ms': [
          100,
          160,
          360,
          580
        ],
        'loop': true
      },
      'hit': {
        'row': 4,
        'ms': [
          80,
          80,
          80,
          80
        ]
      },
      'dead': {
        'row': 5,
        'ms': [
          120,
          180,
          200,
          300
        ]
      }
    }
  },
  'sentry': {
    'src': 'game-ready/vojnici/otpisani-sentry-pixel-sprites.webp',
    'width': 512,
    'height': 512,
    'gutter': 4,
    'anchor': {
      'x': 256,
      'y': 496
    },
    'standingPixels': 448,
    'effectStandingPixels': 194,
    'muzzle': [
      258.58490566037733,
      138.52830188679246
    ],
    'clips': {
      'idle': {
        'row': 0,
        'ms': [
          1000
        ],
        'loop': true
      },
      'walk-left': {
        'row': 1,
        'ms': [
          180,
          180,
          180,
          180
        ],
        'loop': true
      },
      'walk-right': {
        'row': 2,
        'ms': [
          180,
          180,
          180,
          180
        ],
        'loop': true
      },
      'attack': {
        'row': 3,
        'ms': [
          100,
          160,
          360,
          580
        ],
        'loop': true
      },
      'hit': {
        'row': 4,
        'ms': [
          80,
          80,
          80,
          80
        ]
      },
      'dead': {
        'row': 5,
        'ms': [
          120,
          180,
          200,
          300
        ]
      }
    }
  }
}
