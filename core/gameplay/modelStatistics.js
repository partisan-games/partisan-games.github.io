/** Physical reference values in kg, separate from game health and damage.
 * Variant/load qualifications and sources are in docs/STATISTIKE.md.
 * The partisan drawing uses a Panther proxy, not an identified historical vehicle.
 */
export const modelStatistics = {
  'pzkpf-612': { massKg: 8300, structure: 'armored', basis: 'unidentified source; explicit Sd.Kfz.231 collision proxy, not historical identification' },
  'zundapp-k600': { massKg: 343, unladenMassKg: 193, structure: 'soft', basis: 'K600 193 kg reference plus two assumed 75 kg riders; load estimate' },
  'bmw-r12': { massKg: 840, unladenMassKg: 188, structure: 'soft', basis: 'R12 solo 188 kg; sidecar collision mass uses explicit R75 laden proxy' },
  'mercedes-830bl': { massKg: 2500, unladenMassKg: 1950, structure: 'soft', basis: 'Horch 830 BL, 1950 kg plus published 550 kg payload; legacy asset id' },
  partisanTank: { massKg: 44800, structure: 'tank', basis: 'Panther proxy; project reference' },
  'tiger-i': { massKg: 57000, structure: 'tank', basis: 'combat weight' },
  'somua-s35': { massKg: 19500, structure: 'tank', basis: 'combat weight' },
  'stug-iii': { massKg: 23900, structure: 'tank', basis: 'Ausf. G' },
  'm15-42': { massKg: 15500, structure: 'tank', basis: 'combat weight' },
  hummel: { massKg: 24000, structure: 'armored', basis: 'project reference; self-propelled gun' },
  'marder-ii': { massKg: 10800, structure: 'armored', basis: '76.2 mm variant' },
  elefant: { massKg: 65000, structure: 'tank', basis: 'combat weight' },
  'sdkfz-231': { massKg: 8300, structure: 'armored', basis: 'eight-wheel variant' },
  'sdkfz-222': { massKg: 5000, structure: 'armored', basis: 'project reference; approximately 4–5 t depending on variant' },
  'sdkfz-251': { massKg: 7800, structure: 'armored', basis: '251/1 reference; variant dependent' },
  'opel-blitz': { massKg: 5500, unladenMassKg: 2500, structure: 'soft', basis: '3.6-36 S, maximum laden weight' },
  'bmw-r75': { massKg: 840, unladenMassKg: 420, structure: 'soft', basis: 'maximum laden weight, including sidecar' },
  'pak-38': { massKg: 1000, structure: 'towed', basis: 'firing configuration' },
}
