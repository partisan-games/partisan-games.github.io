export const scenes = {
  SpomeniciScena: {
    path: './spomenici/SpomeniciScena.js',
    name: 'Spomeniks',
    icon: 'buildings/kosmaj.png',
    height: 70,
    koordinate: {
      'lat': 44.46785,
      'lng': 20.57175998
    },
  },
  BihacScena: {
    path: './bihac/BihacScena.js',
    name: 'Bihać 1942',
    icon: 'ui/resistance-fighter.png',
    height: 54,
    koordinate: {
      'lat': 44.8158904,
      'lng': 15.7857807
    }
  },
  KraljevoScena: {
    path: './kraljevo/KraljevoScena.js',
    name: 'Kraljevo 1941',
    icon: 'armies/nemci/tenkovi/tenk-odozgo-02.png',
    height: 90,
    koordinate: {
      'lat': 43.72786269,
      'lng': 20.69171242
    }
  },
  RatweekScena: {
    path: './warplane/RatweekScena.js',
    name: 'Operation Ratweek 1944',
    icon: 'armies/britanci/avioni/bomber-lancaster.png',
    height: 72
  },
  RajlovacScena: {
    path: './rajlovac/RajlovacScena.js',
    name: 'Rajlovac 1943',
    icon: 'buildings/kula-01.png',
    height: 78,
    koordinate: {
      'lat': 43.8767521,
      'lng': 18.30863
    }
  },
  TuzlaScena: {
    path: './tuzla/TuzlaScena.js',
    name: 'Tuzla 1943',
    icon: 'ui/mitraljez.png',
    koordinate: {
      'lat': 44.7285887,
      'lng': 17.9828499
    }
  },
  KrupanjScena: {
    path: './krupanj/KrupanjScena.js',
    name: 'Krupanj 1941',
    icon: 'armies/partizani/vojnici/bombasi/partizan-bombas.gif',
    height: 52,
    koordinate: {
      'lat': 44.36377181,
      'lng': 19.3630543
    }
  },
  NeretvaScena: {
    path: './neretva/NeretvaScena.js',
    name: 'Neretva 1943',
    icon: 'armies/nemac-rov.gif',
    height: 60,
    koordinate: {
      'lat': 43.6565522,
      'lng': 17.7455309
    },
  },
  PrijedorScena: {
    path: './prijedor/PrijedorScena.js',
    name: 'Prijedor 1942',
    icon: 'armies/partizani/potez-25.png',
    koordinate: {
      'lat': 44.9828938,
      'lng': 16.6602294
    }
  },
  KorculaScena: {
    path: './korcula/KorculaScena.js',
    name: 'Korčula 1944',
    icon: 'armies/camac.png',
    height: 38,
    koordinate: {
      'lat': 42.9448437,
      'lng': 17.1265954
    }
  },
  OtpisaniScena: {
    path: './OtpisaniScena.js',
    name: 'Beograd 1944',
    icon: 'buildings/ruina-04.png',
    koordinate: { 'lat': 44.81072023, 'lng': 20.48544102 }
  },
  VisScena: {
    path: './vis/VisScena.js',
    name: 'Vis 1944',
    icon: 'armies/avionce.gif',
    height: 60,
    koordinate: {
      'lat': 43.06081146,
      'lng': 16.18390544
    }
  },
  DurmitorScena: {
    path: './durmitor/DurmitorScena.js',
    name: 'Durmitor 1943',
    icon: 'armies/partizani/artiljerija/100mm-skoda.png',
    height: 32,
    koordinate: {
      'lat': 43.2117033,
      'lng': 19.1144196
    }
  },
  LivnoScena: {
    path: './livno/LivnoScena.js',
    name: 'Livno 1943',
    icon: 'buildings/crkva-01.png',
    height: 60,
    koordinate: { 'lat': 43.82941295, 'lng': 16.9979416 }
  },
  TrstScena: {
    path: './tenkici/TrstScena.js',
    name: 'Trst 1945',
    icon: 'armies/partizani/tenkovi/tenk-04.png',
    koordinate: {
      'lat': 45.6523727,
      'lng': 13.7424627
    }
  },
  SutjeskaScena: {
    path: './sutjeska/SutjeskaScena.js',
    name: 'Sutjeska 1943',
    icon: 'armies/ranjeni-partizan.png',
    height: 21,
    koordinate: {
      'lat': 43.3114466,
      'lng': 18.5892073
    }
  },
  DrvarScena: {
    path: './drvar/DrvarScena.js',
    name: 'Drvar 1944',
    icon: 'armies/nemci/padobranci/padobranac-01.png',
    height: 90,
    koordinate: {
      'lat': 44.38001221,
      'lng': 16.38698686
    }
  },
  JasenovacScena: {
    path: './jasenovac/JasenovacScena.js',
    name: 'Jasenovac 1945',
    icon: 'items/bodljikava-zica.gif',
    height: 28,
    koordinate: { 'lat': 45.28028223, 'lng': 16.92837349 }
  },
  MainMenu: {
    path: './MainMenu.js',
    name: 'Main Menu'
  }
}

function findMinMaxCoordinates(mesta, margin = 0.1) {
  let latMin = Infinity
  let latMax = -Infinity
  let lngMin = Infinity
  let lngMax = -Infinity

  for (const kljuc in mesta) {
    const mesto = scenes[kljuc]
    if (!mesto.koordinate) continue

    const { lat, lng } = mesto.koordinate

    if (lat < latMin) latMin = lat
    if (lat > latMax) latMax = lat
    if (lng < lngMin) lngMin = lng
    if (lng > lngMax) lngMax = lng
  }

  // Dodavanje margine (proširenje opsega)
  const latPadding = (latMax - latMin) * margin
  const lngPadding = (lngMax - lngMin) * margin

  return {
    latRange: { min: latMin - latPadding, max: latMax + latPadding },
    lngRange: { min: lngMin - lngPadding, max: lngMax + lngPadding }
  }
}

function calculatePercentage(koordinate, latRange, lngRange) {
  const y = 1 - (koordinate.lat - latRange.min) / (latRange.max - latRange.min)
  const x = (koordinate.lng - lngRange.min) / (lngRange.max - lngRange.min)

  return { y, x }
}

const { latRange, lngRange } = findMinMaxCoordinates(scenes, 0.1) // 10% margine

for (const kljuc in scenes) {
  const scena = scenes[kljuc]
  if (!scena.koordinate) continue
  scena.procenti = calculatePercentage(scena.koordinate, latRange, lngRange)
}
