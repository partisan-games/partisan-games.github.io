// Measurements of the art, kept by hand.
export default {
  rifleman: {
    src: 'game-ready/vojnici/advance-rifleman.png', width: 192, height: 168, anchor: { x: 62, y: 152 }, standingPixels: 138,
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
    src: 'game-ready/vojnici/advance-backpack.png', width: 192, height: 168, anchor: { x: 62, y: 152 }, standingPixels: 138,
    clips: {
      idle: { row: 0, ms: [1000], loop: true },
      walk: { row: 1, ms: [72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72], loop: true },
      fire: { row: 2, ms: [34, 32, 34, 30], loop: false, muzzles: [[63, -110], [59, -110], [63, -110], [65, -110]] },
    },
  },
  officer: {
    src: 'game-ready/vojnici/advance-officer.png', width: 192, height: 168, anchor: { x: 62, y: 152 }, standingPixels: 138,
    clips: {
      idle: { row: 0, ms: [1000], loop: true },
      walk: { row: 1, ms: [72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72], loop: true },
      signal: { row: 2, ms: [100, 140, 400, 400, 160, 200], loop: false },
    },
  },
  gunner: {
    src: 'game-ready/vojnici/advance-gunner.png', width: 192, height: 168, anchor: { x: 62, y: 152 }, standingPixels: 138,
    clips: {
      idle: { row: 0, ms: [1000], loop: true },
      walk: { row: 1, ms: [72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72], loop: true },
      fire: { row: 2, ms: [34, 32, 34, 30], loop: false, muzzles: [[70, -108], [66, -108], [70, -108], [72, -108]] },
    },
  },
  tank: {
    src: 'game-ready/tenkovi/advance-tank.png', width: 542, height: 282, anchor: { x: 200, y: 282 }, standingPixels: 182, crewAnchor: { x: 206, y: 120 },
    clips: {
      idle: { row: 0, ms: [1000], loop: true },
      drive: { row: 1, ms: [95, 95, 95, 95, 95, 95], loop: true },
    },
  },
  commander: {
    src: 'game-ready/vojnici/advance-commander.png', width: 104, height: 92, anchor: { x: 34, y: 84 }, standingPixels: 76,
    clips: {
      idle: { row: 0, ms: [300, 135, 135, 245, 135, 135], loop: true },
    },
  },
}
