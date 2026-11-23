/** Physical reference values in kg, separate from game health and damage.
 * Variant/load qualifications and sources are in docs/STATISTIKE.md.
 * The partisan drawing uses a Panther proxy, not an identified historical vehicle.
 */
export const modelStatistics = {
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
