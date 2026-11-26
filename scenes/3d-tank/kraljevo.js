import * as THREE from 'three'
import { createBoxes } from '/core3d/geometry/index.js'
import { createTexturedBuilding } from '/core3d/city.js'
import { loadModel } from '/core3d/loaders.js'
import { loadedModel } from '/core3d/assets/models.js'
import { campModels } from '/core3d/actor/buildings/CampProp.js'
import Milutin, { models as monumentModels } from '/core3d/actor/buildings/Milutin.js'
import TownHouse, { modelOf as townHouseModel } from '/core3d/actor/buildings/TownHouse.js'
import { models as sandbagsModels } from '/core3d/actor/buildings/Sandbags.js'
import { models as cannonModels } from '/core3d/actor/derived/Cannon.js'

/**
 * The way into Kraljevo on 31 October 1941, in metres, the tank coming along +z on the road from Čačak: the wire and
 * the trench before the farming school, a German strongpoint, then a street barred twice, and the square with the
 * monument to the Serbian warriors. The sources name the places, not their distances; these are chosen for play.
 */
export const kraljevo = {
  road: { width: 8, from: -90, to: 215 },
  wire: { z: 45, half: 40 },
  trench: { z: 58, half: 38, gap: 4.5 },
  nests: [{ x: -16, z: 62 }, { x: 18, z: 62 }],
  bunker: { x: -30, z: 72 },
  gun: { x: 8, z: 76 },
  school: { x: 31, z: 96 },
  street: { half: 13, from: 130, length: 18, gap: 2, houses: 4, height: [9, 13] },
  barricades: [58, 140, 175],
  square: { z: 232, radius: 18, houses: [0, .25, .5, 1.5, 1.75, .72, 1.28] },
}

/** German posts cover the trench and school first, then the two street barricades. */
export const posts = [
  { x: -16, z: 63.5, arm: 'machineGun' }, { x: 18, z: 63.5, arm: 'machineGun' },
  { x: -24, z: 75, arm: 'rifle' }, { x: 8, z: 79, arm: 'rifle' }, { x: 28, z: 86, arm: 'rifle', kind: 'officer' },
  { x: -3, z: 144, arm: 'rifle', kind: 'ss' }, { x: 3, z: 179, arm: 'rifle' }, { x: -5, z: 182, arm: 'rifle' },
]

/**
 * How far and how hard the dug-in Germans fire, in metres and health. They outreach the men with the tank, whose
 * rifles carry 40 m, so infantry cannot take a post alone; the tank's gun outreaches them all. A tank that rushes the
 * line takes its men into this fire, and most of them fall; one that first shells the posts from afar, with its men
 * beside it, opens the way for them.
 */
export const defence = { machineGun: { reach: 55, damage: [30, 50] }, rifle: { reach: 45, damage: [15, 35] } }

/** What to load before the scene is built. */
/** The farming school: a two-storey public building of the town's kind. */
const schoolKind = 'european-building'

export const models = [...sandbagsModels, campModels['fence-straight'], townHouseModel(schoolKind), ...cannonModels, ...monumentModels]

const facades = ['building-front.png', 'building-green-front.png', 'building-blue-front.png', 'ruin-front.jpg']
const earth = 0x8a7350
const cobbles = 0x8c8a84

/** Builds the way in on `physics`; solid things are fixed, the crates of the barricades loose, for the tank to push. */
export async function buildKraljevo(physics) {
  const { scene } = physics
  const { road, wire, trench, nests, bunker, gun, school, street, barricades, square } = kraljevo

  /** A fixed box `size` big at `at`, unseen, for what is drawn by `visual`; a shell that strikes it scars there. */
  const solid = (visual, size, at, turn = 0) => {
    const body = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z))
    body.visible = false
    body.position.set(at.x, size.y / 2, at.z)
    body.rotation.y = turn
    physics.add(body, 0)
    if (visual) {
      visual.position.set(at.x, 0, at.z)
      visual.rotation.y = turn
      scene.add(visual)
    }
  }

  const flat = (geometry, color, x, z) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color }))
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(x, .02, z)
    mesh.receiveShadow = true
    scene.add(mesh)
  }
  flat(new THREE.PlaneGeometry(road.width, road.to - road.from), earth, 0, (road.from + road.to) / 2)
  flat(new THREE.PlaneGeometry(street.half * 2, square.z - street.from + street.length), cobbles, 0, (street.from + square.z) / 2)
  flat(new THREE.CircleGeometry(square.radius, 32), cobbles, 0, square.z)
  solid(new Milutin().mesh, { x: 10, y: 1.5, z: 10 }, { x: 0, z: square.z })

  // the barbed wire before the trench, across the road too
  for (let x = -wire.half; x < wire.half; x += 5) {
    const fence = loadedModel(campModels['fence-straight']).clone(true)
    fence.position.set(x + 2.5, 0, wire.z)
    scene.add(fence)
  }

  const sandbags = () => loadedModel(sandbagsModels[0]).clone(true)
  const bagSize = { x: 4.27, y: 1.1, z: 1.1 }
  for (let x = -trench.half; x < trench.half; x += bagSize.x)
    if (Math.abs(x + bagSize.x / 2) > trench.gap) solid(sandbags(), bagSize, { x: x + bagSize.x / 2, z: trench.z })

  // each machine gun behind a wall of bags with a bag either side
  for (const { x, z } of nests) {
    solid(sandbags(), bagSize, { x, z })
    for (const side of [-1, 1]) solid(sandbags(), bagSize, { x: x + side * 2.6, z: z + 2 }, Math.PI / 2)
  }

  const pillbox = await loadModel({ file: 'building/bunker.fbx', size: 3, texture: 'terrain/concrete.jpg' })
  solid(pillbox, new THREE.Box3().setFromObject(pillbox).getSize(new THREE.Vector3()), bunker)

  // the gun looks down the road at what comes
  solid(loadedModel(cannonModels[0]).clone(true), { x: 1.6, y: 1.3, z: 4 }, gun)

  // the farming school by the road, its long side along it and its near side `school.x` from the road's middle
  const schoolHouse = new TownHouse(schoolKind).mesh
  const schoolSize = new THREE.Box3().setFromObject(schoolHouse).getSize(new THREE.Vector3())
  solid(schoolHouse, schoolSize, { x: school.x + schoolSize.z / 2, z: school.z }, Math.PI / 2)

  // the street: houses face each other across it
  for (let i = 0; i < street.houses; i++)
    for (const side of [-1, 1]) {
      const height = THREE.MathUtils.randFloat(...street.height)
      const front = `buildings/${facades[(i * 2 + (side + 1) / 2) % facades.length]}`
      const width = 12
      // a house's face to the street is its +x side on the left and its -x side on the right
      const house = createTexturedBuilding({ width, height, depth: street.length, y: 0, defaultFile: 'buildings/building-back.png',
        files: side < 0 ? [front] : [null, front] })
      house.position.set(side * (street.half - 5 + width / 2), height / 2, street.from + i * (street.length + street.gap))
      physics.add(house, 0)
    }

  // the square, built round but where the street comes in, at half a turn
  square.houses.forEach((turn, i) => {
    const angle = Math.PI * turn
    const height = THREE.MathUtils.randFloat(...street.height)
    const house = createTexturedBuilding({ width: 16, height, depth: 10, y: 0, defaultFile: 'buildings/building-back.png',
      files: [null, null, null, `buildings/${facades[i % facades.length]}`] })
    const distance = square.radius + 8
    house.position.set(Math.sin(angle) * distance, height / 2, square.z + Math.cos(angle) * distance)
    // its front, +z, to the middle of the square
    house.rotation.y = angle + Math.PI
    physics.add(house, 0)
  })

  barricades.flatMap(z => createBoxes({ width: 8, height: 2, depth: 1, z: z - 6 })).forEach(mesh => physics.add(mesh, 20))
}
