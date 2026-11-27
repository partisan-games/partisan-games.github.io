// Measurements of the art, kept by hand.
export default {
  rifleman: {
    src: 'game-ready/vojnici/advance-rifleman.webp', width: 192, height: 168, anchor: { x: 62, y: 152 }, standingPixels: 138,
    clips: {
      idle: { row: 0, ms: [1000], loop: true },
      walk: { row: 1, ms: [72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72], loop: true },
      fire: { row: 2, ms: [34, 32, 34, 30], loop: false, muzzles: [[85, -110], [81, -110], [85, -110], [87, -110]] },
      'walk-aim': { row: 3, ms: [72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72], loop: true },
      kneel: { row: 4, ms: [60, 60, 55], loop: false },
      crouch: { row: 5, ms: [1000], loop: true },
      'crouch-fire': { row: 6, ms: [34, 32, 34, 30], loop: false, muzzles: [[98, -74], [94, -74], [98, -74], [100, -74]] },
      'crouch-walk': { row: 7, ms: [144, 144, 144, 144, 144, 144], loop: true },
    },
  },
  backpack: {
    src: 'game-ready/vojnici/advance-backpack.webp', width: 192, height: 168, anchor: { x: 62, y: 152 }, standingPixels: 138,
    clips: {
      idle: { row: 0, ms: [1000], loop: true },
      walk: { row: 1, ms: [72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72], loop: true },
      fire: { row: 2, ms: [34, 32, 34, 30], loop: false, muzzles: [[63, -110], [59, -110], [63, -110], [65, -110]] },
    },
  },
  officer: {
    src: 'game-ready/vojnici/advance-officer.webp', width: 192, height: 168, anchor: { x: 62, y: 152 }, standingPixels: 138,
    clips: {
      idle: { row: 0, ms: [1000], loop: true },
      walk: { row: 1, ms: [72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72], loop: true },
      signal: { row: 2, ms: [100, 140, 400, 400, 160, 200], loop: false },
    },
  },
  gunner: {
    src: 'game-ready/vojnici/advance-gunner.webp', width: 192, height: 168, anchor: { x: 62, y: 152 }, standingPixels: 138,
    clips: {
      idle: { row: 0, ms: [1000], loop: true },
      walk: { row: 1, ms: [72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72], loop: true },
      fire: { row: 2, ms: [34, 32, 34, 30], loop: false, muzzles: [[70, -108], [66, -108], [70, -108], [72, -108]] },
    },
  },
  tank: {
    gutter: 4,
    src: 'game-ready/tenkovi/advance-tank.webp', width: 542, height: 282, anchor: { x: 200, y: 282 }, standingPixels: 182, crewAnchor: { x: 206, y: 120 },
    conditionSrc: 'game-ready/tenkovi/panzer-iii-damage.webp',
    clips: {
      idle: { row: 0, ms: [1000], loop: true },
      drive: { row: 1, ms: [95, 95, 95, 95, 95, 95], loop: true },
      fire: { row: 0, ms: [240], muzzles: [[201, -133]] },
    },
  },
  t34: {
    src: 'game-ready/tenkovi/t34-85-sprites.webp', width: 672, height: 240, gutter: 4,
    conditionSrc: 'game-ready/tenkovi/t34-85-damage.webp',
    anchor: { x: 265, y: 232 }, standingPixels: 216,
    clips: {
      idle: { row: 0, ms: [1000], loop: true },
      drive: { row: 1, ms: [95, 95, 95, 95, 95, 95], loop: true },
      fire: { row: 2, ms: [40, 70, 100, 130], muzzles: [[390, -161]], effectScale: 3 },
    },
  },
  commander: {
    src: 'game-ready/vojnici/advance-commander.webp', width: 104, height: 128, gutter: 4, anchor: { x: 34, y: 84 }, standingPixels: 76,
    clips: {
      idle: { row: 0, ms: [300, 135, 135, 245, 135, 135], loop: true },
      hit: { row: 1, ms: [65, 85] },
      dead: { row: 2, ms: [75, 90, 100, 120, 100] },
    },
  },
}
