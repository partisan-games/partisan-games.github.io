/** Measurements of the art, kept by hand. */
import spriteArt from './spriteArt.js'

export default {
  'partisanTank': {
    gutter: 4,
    'src': 'game-ready/tenkovi/partizanski-tenk-layers.webp',
    damageSrc: 'game-ready/tenkovi/partisan-tank-armor-hits.webp',
    'frame': {
      'width': 300,
      'height': 129
    },
    'columns': 4,
    'clips': {
      'idle': {
        'row': 0,
        'seconds': 1.4,
        'loop': true
      },
      'drive': {
        'row': 1,
        'seconds': 0.64,
        'loop': true
      }
    }
  },
  'germanTank': {
    gutter: 4,
    'src': 'game-ready/tenkovi/nemacki-tenk-layers.webp',
    damageSrc: 'game-ready/tenkovi/tiger-i-armor-hits.webp',
    'frame': {
      'width': 327,
      'height': 137
    },
    'columns': 4,
    'clips': {
      'idle': {
        'row': 0,
        'seconds': 1.4,
        'loop': true
      },
      'drive': {
        'row': 1,
        'seconds': 0.64,
        'loop': true
      }
    }
  },
  'somuaS35': {
    gutter: 4,
    'src': 'game-ready/tenkovi/somua-s35-layers.webp',
    damageSrc: 'game-ready/tenkovi/somua-s35-armor-hits.webp',
    'frame': {
      'width': 379,
      'height': 166
    },
    'columns': 4,
    'clips': {
      'idle': {
        'row': 0,
        'seconds': 1.4,
        'loop': true
      },
      'drive': {
        'row': 1,
        'seconds': 0.64,
        'loop': true
      }
    }
  },
  'opelBlitz': {
    ...spriteArt['opel-blitz'],
    contentBounds: [15, 7, 306, 149],
    size: [137, 60]
  }
}
