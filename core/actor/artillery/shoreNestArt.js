// Measurements of the art, kept by hand.
export default {
  'src': 'game-ready/polozaji/mitraljesko-gnezdo-odozgo.webp',
  'gun': {
    'src': 'game-ready/polozaji/shore-mg-gun.webp',
    'width': 192,
    'height': 96,
    'anchor': {
      'x': 80,
      'y': 48
    },
    'muzzle': [
      184,
      48
    ],
    'clips': {
      'idle': {
        'ms': [
          1000
        ],
        'loop': true
      }
    }
  },
  'crew': {
    'src': 'game-ready/polozaji/shore-mg-crew.webp',
    'width': 128,
    'height': 80,
    'anchor': {
      'x': 64,
      'y': 40
    },
    'clips': {
      'idle': {
        'ms': [
          1000
        ],
        'loop': true
      },
      'dead': {
        'ms': [
          1000
        ],
        'frameColumns': [
          1
        ]
      }
    }
  }
}
