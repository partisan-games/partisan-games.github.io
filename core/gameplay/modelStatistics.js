/** Real reference values, separate from game health and damage: mass in kg, top road speed in km/h and main armament.
 * Variant/load qualifications and sources are in docs/STATISTIKE.md; a value the sources lack is left out.
 * The partisan drawing uses a Panther proxy, not an identified historical vehicle.
 */
export const modelStatistics = {
  'pzkpf-612': { massKg: 8300, structure: 'armored', basis: 'unidentified source; explicit Sd.Kfz.231 collision proxy, not historical identification' },
  'zundapp-k600': { massKg: 343, unladenMassKg: 193, structure: 'soft', basis: 'K600 193 kg reference plus two assumed 75 kg riders; load estimate' },
  'bmw-r12': { massKg: 840, unladenMassKg: 188, structure: 'soft', basis: 'R12 solo 188 kg; sidecar collision mass uses explicit R75 laden proxy' },
  'mercedes-830bl': { massKg: 2500, unladenMassKg: 1950, structure: 'soft', basis: 'Horch 830 BL, 1950 kg plus published 550 kg payload; legacy asset id' },
  partisanTank: { massKg: 44800, armament: '75 mm KwK 42', structure: 'tank', basis: 'Panther proxy; project reference' },
  'tiger-i': { massKg: 57000, speedKmh: 45, armament: '88 mm KwK 36', structure: 'tank', basis: 'combat weight' },
  'somua-s35': { massKg: 19500, speedKmh: 40, armament: '47 mm SA35', structure: 'tank', basis: 'combat weight' },
  'stug-iii': { massKg: 23900, speedKmh: 40, armament: '75 mm StuK 40 L/48', structure: 'tank', basis: 'Ausf. G' },
  'm15-42': { massKg: 15500, speedKmh: 38, armament: '47 mm L/40', structure: 'tank', basis: 'combat weight' },
  hummel: { massKg: 24000, speedKmh: 42, armament: '150 mm sFH 18', structure: 'armored', basis: 'project reference; self-propelled gun' },
  'marder-ii': { massKg: 10800, speedKmh: 40, armament: '76,2 mm Pak 36(r)', structure: 'armored', basis: '76.2 mm variant' },
  elefant: { massKg: 65000, speedKmh: 30, armament: '88 mm Pak 43', structure: 'tank', basis: 'combat weight' },
  'sdkfz-231': { massKg: 8300, speedKmh: 85, armament: '20 mm KwK 30', structure: 'armored', basis: 'eight-wheel variant' },
  'sdkfz-222': { massKg: 5000, armament: '20 mm KwK 38', structure: 'armored', basis: 'project reference; approximately 4–5 t depending on variant' },
  'sdkfz-251': { massKg: 7800, speedKmh: 52.5, armament: 'MG 34/42', structure: 'armored', basis: '251/1 reference; variant dependent' },
  'opel-blitz': { massKg: 5500, unladenMassKg: 2500, structure: 'soft', basis: '3.6-36 S, maximum laden weight' },
  'bmw-r75': { massKg: 840, unladenMassKg: 420, structure: 'soft', basis: 'maximum laden weight, including sidecar' },
  'pak-38': { massKg: 1000, armament: '50 mm Pak 38', structure: 'towed', basis: 'firing configuration' },
  lancaster: { massKg: 16738, speedKmh: 454, armament: '8 × 7,7 mm Browning; 6.400 kg bombi', structure: 'aircraft', basis: 'Lancaster I, empty weight' },
  'b-17': { massKg: 16391, speedKmh: 462, armament: '13 × 12,7 mm M2 Browning; 3.600 kg bombi', structure: 'aircraft', basis: 'B-17G, empty weight' },
  'b-24': { massKg: 16556, speedKmh: 467, armament: '10 × 12,7 mm M2 Browning; 3.600 kg bombi', structure: 'aircraft', basis: 'B-24J, empty weight' },
  'b-25': { massKg: 8836, speedKmh: 438, armament: '12 × 12,7 mm M2 Browning; 1.360 kg bombi', structure: 'aircraft', basis: 'B-25J, empty weight' },
  'bf-109': { massKg: 2247, speedKmh: 530, armament: '2 × 13 mm MG 131, 1 × 20 mm MG 151/20', structure: 'aircraft', basis: 'Bf 109 G-6, empty weight' },
  'ju-52': { massKg: 5720, speedKmh: 265.5, armament: '2 × 7,92 mm MG 15; 500 kg bombi', structure: 'aircraft', basis: 'Ju 52/3m g3e, empty weight; speed at sea level' },
}
