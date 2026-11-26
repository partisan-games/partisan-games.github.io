/** The models of the buildings that are not made of boxes: what to load before one is made. */
export const towerModel = {
  file: 'building/tower/ww2/D85VT1X9UHDSYASVUM1UY02HA.obj',
  mtl: 'building/tower/ww2/D85VT1X9UHDSYASVUM1UY02HA.mtl',
  size: 18,
  shouldAdjustHeight: true,
}
export const factoryModel = { file: 'building/factory/model.fbx', size: 25 }
/** Where a factory's chimney smokes, in metres from where it stands. */
export const factoryChimney = [13, 28]

/**
 * The bombers parked on an airfield, targets that do not move: each model, and `origin`, how high above the wheels its
 * model's middle is, as a share of its height.
 */
export const parkedBombers = {
  dornier: { model: { file: 'aircraft/dornier-do-217/WXSUTGFGGAETK9J6AYCJWA8OO.obj',
    mtl: 'aircraft/dornier-do-217/WXSUTGFGGAETK9J6AYCJWA8OO.mtl', size: 3 }, origin: .5 },
  stuka: { model: { file: 'aircraft/junkers-ju-87-stuka/B6L6UIB83ZKUE6YOCT94DAHM3.obj',
    mtl: 'aircraft/junkers-ju-87-stuka/B6L6UIB83ZKUE6YOCT94DAHM3.mtl', size: 3.9 }, origin: .5 },
  heinkel: { model: { file: 'aircraft/heinkel-he-111/model.fbx', size: 4, angle: .125, axis: [1, 0, 0] }, origin: .27 },
}
