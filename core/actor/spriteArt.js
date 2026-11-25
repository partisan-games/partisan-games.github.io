/** Measurements of the art, kept by hand. */
export default {
  'rifleman': {
    'src': 'game-ready/vojnici/nemacki-strelac-sprites.webp',
    'frame': {
      'width': 128,
      'height': 128
    },
    'columns': 4,
    'anchor': {
      'x': 64,
      'y': 120
    },
    'body': [
      40,
      23,
      107,
      120
    ],
    'clips': {
      'idle': {
        'row': 0,
        'frameCount': 4,
        'seconds': 1.4,
        'loop': true
      },
      'fire': {
        'row': 1,
        'frameCount': 4,
        'seconds': 0.32,
        'loop': false
      },
      'death': {
        'row': 2,
        'frameCount': 4,
        'seconds': 0.64,
        'loop': false
      },
      'rest': {
        'row': 3,
        'frameCount': 4,
        'seconds': 1.6,
        'loop': true
      },
      'walk': {
        'row': 4,
        'frameCount': 4,
        'seconds': 0.8,
        'loop': true
      },
      'fireUp': {
        'row': 5,
        'frameCount': 4,
        'seconds': 0.32,
        'loop': false,
        'muzzle': {
          'x': 87,
          'y': 15
        }
      }
    }
  },
  'assault': {
    'src': 'game-ready/vojnici/nemacki-jurisnik-sprites.webp',
    'frame': {
      'width': 128,
      'height': 128
    },
    'columns': 4,
    'anchor': {
      'x': 64,
      'y': 120
    },
    'body': [
      14,
      35,
      118,
      120
    ],
    'clips': {
      'idle': {
        'row': 0,
        'frameCount': 4,
        'seconds': 1.4,
        'loop': true
      },
      'fire': {
        'row': 1,
        'frameCount': 4,
        'seconds': 0.32,
        'loop': false
      },
      'death': {
        'row': 2,
        'frameCount': 4,
        'seconds': 0.64,
        'loop': false
      },
      'rest': {
        'row': 3,
        'frameCount': 4,
        'seconds': 1.6,
        'loop': true
      },
      'walk': {
        'row': 4,
        'frameCount': 4,
        'seconds': 0.8,
        'loop': true
      },
      'fireUp': {
        'row': 5,
        'frameCount': 4,
        'seconds': 0.32,
        'loop': false,
        'muzzle': {
          'x': 100,
          'y': 26
        }
      }
    }
  },
  'opel-blitz': {
    'src': 'game-ready/kamioni/opel-blitz-sprites.webp',
    'frame': {
      'width': 320,
      'height': 160
    },
    'columns': 4,
    'anchor': {
      'x': 160,
      'y': 148
    },
    'body': [
      16,
      8,
      305,
      149
    ],
    'clips': {
      'idle': {
        'row': 0,
        'frameCount': 4,
        'seconds': 1.4,
        'loop': true
      },
      'drive': {
        'row': 1,
        'frameCount': 4,
        'seconds': 0.64,
        'loop': true
      }
    }
  },
  'opel-blitz-legion': {
    'src': 'game-ready/kamioni/opel-blitz-legion-sprites.webp',
    'frame': {
      'width': 320,
      'height': 160
    },
    'columns': 4,
    'anchor': {
      'x': 160,
      'y': 148
    },
    'body': [
      14,
      8,
      305,
      150
    ],
    'clips': {
      'idle': {
        'row': 0,
        'frameCount': 4,
        'seconds': 1.4,
        'loop': true
      },
      'drive': {
        'row': 1,
        'frameCount': 4,
        'seconds': 0.64,
        'loop': true
      }
    }
  },
  'hummel': {
    'src': 'game-ready/tenkovi/hummel-sprites.webp',
    'frame': {
      'width': 320,
      'height': 160
    },
    'columns': 4,
    'anchor': {
      'x': 160,
      'y': 148
    },
    'body': [
      11,
      10,
      309,
      148
    ],
    'clips': {
      'idle': {
        'row': 0,
        'frameCount': 4,
        'seconds': 1.4,
        'loop': true
      },
      'drive': {
        'row': 1,
        'frameCount': 4,
        'seconds': 0.64,
        'loop': true
      }
    }
  },
  'bp42': {
    'src': 'game-ready/vozovi/bp42-sprites.webp',
    'frame': {
      'width': 576,
      'height': 256
    },
    'columns': 4,
    'anchor': {
      'x': 288,
      'y': 232
    },
    'body': [
      10,
      21,
      568,
      233
    ],
    'clips': {
      'idle': {
        'row': 0,
        'frameCount': 1,
        'seconds': 1.4,
        'loop': true
      },
      'drive': {
        'row': 1,
        'frameCount': 4,
        'seconds': 0.64,
        'loop': true
      }
    }
  },
  'muzzle-flash': {
    'src': 'game-ready/efekti/plamen-pucnja-sprites.webp',
    'frame': {
      'width': 48,
      'height': 48
    },
    'columns': 4,
    'anchor': {
      'x': 12,
      'y': 24
    },
    'body': [
      5,
      10,
      25,
      35
    ],
    'clips': {
      'fire': {
        'row': 0,
        'frameCount': 4,
        'seconds': 0.24,
        'loop': false
      }
    }
  }
}
