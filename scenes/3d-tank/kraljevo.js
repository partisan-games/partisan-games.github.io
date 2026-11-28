import * as THREE from 'three'
import { loadModel } from '/core3d/loaders.js'
import { loadedModel } from '/core3d/assets/models.js'
import Milutin, { models as monumentModels } from '/core3d/actor/buildings/Milutin.js'
import Church, { models as churchModels } from '/core3d/actor/buildings/Church.js'
import Tree, { trees } from '/core3d/actor/nature/Tree.js'
import TownHouse, { modelOf as townHouseModel } from '/core3d/actor/buildings/TownHouse.js'
import FacadeHouse, { facades as facadeKinds } from '/core3d/actor/buildings/FacadeHouse.js'
import SandbagWall, { models as sandbagsModels } from '/core3d/actor/buildings/SandbagWall.js'
import { models as cannonModels } from '/core3d/actor/derived/Cannon.js'
import Barricade, { models as barricadeModels } from '/core3d/actor/buildings/Barricade.js'
import WireFence, { models as wireModels } from '/core3d/actor/buildings/WireFence.js'
import ConcreteBlock, { concreteMaterial, wallCourses } from '/core3d/actor/buildings/ConcreteBlock.js'

/**
 * The way into Kraljevo on 31 October 1941, in metres, the tank coming along +z on the road from Čačak: the wire and
 * the trench before the farming school, a German strongpoint, then a street barred twice, and the square with the
 * monument to the Serbian warriors. The sources name the places, not their distances; these are chosen for play.
 */
export const kraljevo = {
  road: { width: 8, from: -90, to: 215 },
  // The gaps and setback of the old avenue vary independently on each side.
  avenue: { aside: [6.5, 11], apart: [8, 21], to: 38, height: [.78, 1.12] },
  wire: { z: 45, half: 40 },
  trench: { z: 58, half: 38, gap: 4.5 },
  nests: [{ x: -16, z: 62 }, { x: 18, z: 62 }],
  bunker: { x: -30, z: 72 },
  // the German guns, one behind the trench and one before the square, which fire at the tank (owner, 2026-11-28)
  guns: [{ x: 8, z: 76 }, { x: -8, z: 200 }],
  // what the tank takes before it is destroyed: a shell of a gun takes `enemyGun.damage`
  armor: { health: 500 },
  school: { x: 31, z: 96 },
  street: { half: 13, from: 130, length: 18, gap: 2, houses: 4, height: [9, 13] },
  barricades: [58, 140, 175],
  // walls of loose concrete blocks, for the tank to knock down for the joy of trying it (owner, 2026-11-28): along the
  // road and in the fields, and one across the road before the street; `turn` π/2 runs a wall along the road
  blockWalls: [
    { x: 0, z: 112, length: 8, courses: 2, turn: 0 },
    { x: -15, z: 100, length: 12, courses: 3, turn: Math.PI / 2 },
    { x: 15, z: 20, length: 6, courses: 3, turn: Math.PI / 2 },
    { x: -22, z: 8, length: 8, courses: 2, turn: 0 },
  ],
  // the church on the square, half a turn round from the street, `scale` times the village church it is drawn from;
  // the court across the square from the street
  square: { z: 232, radius: 18, houses: [.25, 1.5, 1.75, .72, 1.28], church: { turn: .5, scale: 1.5 }, court: { turn: 0 } },
}

/** German posts cover the trench and school, the two street barricades and the entrance to the square. */
export const posts = [
  { x: -16, z: 63.5, arm: 'machineGun' }, { x: 18, z: 63.5, arm: 'machineGun' },
  { x: -8, z: 60.5, arm: 'rifle' }, { x: 9, z: 60.5, arm: 'rifle' },
  { x: -24, z: 75, arm: 'rifle' }, { x: 8, z: 79, arm: 'rifle' }, { x: 28, z: 86, arm: 'rifle', kind: 'officer' },
  { x: 23, z: 100, arm: 'rifle' },
  { x: -3, z: 144, arm: 'rifle', kind: 'ss' }, { x: -6, z: 146, arm: 'rifle' }, { x: 5, z: 149, arm: 'rifle' },
  { x: 3, z: 179, arm: 'rifle' }, { x: -5, z: 182, arm: 'rifle' }, { x: 6, z: 185, arm: 'rifle' },
  { x: -6, z: 219, arm: 'rifle' }, { x: 6, z: 221, arm: 'rifle' },
]

/**
 * How far and how hard the dug-in Germans fire, in metres and health. They outreach the men with the tank, whose
 * rifles carry 40 m, so infantry cannot take a post alone; the tank's gun outreaches them all. A tank that rushes the
 * line takes its men into this fire, and most of them fall; one that first shells the posts from afar, with its men
 * beside it, opens the way for them.
 */
export const defence = { machineGun: { reach: 55, damage: [30, 50] }, rifle: { reach: 45, damage: [15, 35] } }

/** The farming school: a two-storey public building of the town's kind. */
const schoolKind = 'european-building'
/** The court on the square: a building of the project, with an arched door, stands in until Codex reworks it (owner, 2026-11-28). */
const courtKind = 'building'

/** What to load before the scene is built. */
export const models = [...sandbagsModels, ...wireModels, townHouseModel(schoolKind), townHouseModel(courtKind),
  ...cannonModels, ...monumentModels,
  trees.linden.model, ...barricadeModels, ...churchModels]

const facades = Object.keys(facadeKinds)
const earth = 0x8a7350
/**
 * Each barricade is three stretches of sandbags across the road, each light enough, at `mass` kilograms, for the tank
 * to push aside, as it pushed the crates before them.
 */
const barricade = { across: [-1, 0, 1], mass: 110 }
const cobbles = 0x8c8a84

/**
 * Builds the way in on `physics`; solid things are fixed, the sandbags of the barricades loose, for the tank to push.
 * Gives the drawn guns, one for each of `kraljevo.guns`, for the scene to turn.
 */
export async function buildKraljevo(physics) {
  const { scene } = physics
  const { road, avenue, wire, trench, nests, bunker, guns, school, street, barricades, blockWalls, square } = kraljevo

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

  const { randFloat } = THREE.MathUtils
  for (const side of [-1, 1])
    for (let z = road.from + randFloat(4, 16); z < avenue.to; z += randFloat(...avenue.apart)) {
      const tree = new Tree('linden').mesh
      tree.scale.multiplyScalar(randFloat(...avenue.height))
      solid(tree, { x: .6, y: 4, z: .6 }, { x: side * randFloat(...avenue.aside), z }, Math.random() * Math.PI * 2)
    }

  // the barbed wire before the trench, across the road too, light enough for the tank to knock over (owner, 2026-11-28)
  for (let x = -wire.half; x < wire.half; x += WireFence.width) {
    const { mesh } = new WireFence()
    mesh.position.x = x + WireFence.width
    mesh.position.z = wire.z
    physics.add(mesh, WireFence.mass)
  }

  // the walls of bags of the trench and the nests are loose, for the tank to push aside (owner, 2026-11-28)
  const sandbags = (at, turn = 0) => {
    const { mesh } = new SandbagWall()
    mesh.position.x = at.x
    mesh.position.z = at.z
    mesh.rotation.y = turn
    physics.add(mesh, SandbagWall.mass)
  }
  const bag = SandbagWall.width
  for (let x = -trench.half; x < trench.half; x += bag)
    if (Math.abs(x + bag / 2) > trench.gap) sandbags({ x: x + bag / 2, z: trench.z })

  // each machine gun behind a wall of bags with a bag either side
  for (const { x, z } of nests) {
    sandbags({ x, z })
    for (const side of [-1, 1]) sandbags({ x: x + side * 2.6, z: z + 2 }, Math.PI / 2)
  }

  const pillbox = await loadModel({ file: 'building/bunker.fbx', size: 3, texture: 'terrain/concrete.jpg' })
  solid(pillbox, new THREE.Box3().setFromObject(pillbox).getSize(new THREE.Vector3()), bunker)

  // each gun looks down the road at what comes, turning to it once in reach
  const gunVisuals = guns.map(at => {
    const visual = loadedModel(cannonModels[0]).clone(true)
    solid(visual, { x: 1.6, y: 1.3, z: 4 }, at)
    return visual
  })

  // the farming school by the road, its long side along it and its near side `school.x` from the road's middle
  const schoolHouse = new TownHouse(schoolKind).mesh
  const schoolSize = new THREE.Box3().setFromObject(schoolHouse).getSize(new THREE.Vector3())
  solid(schoolHouse, schoolSize, { x: school.x + schoolSize.z / 2, z: school.z }, Math.PI / 2)

  // the street: houses face each other across it
  for (let i = 0; i < street.houses; i++)
    for (const side of [-1, 1]) {
      const height = THREE.MathUtils.randFloat(...street.height)
      const facade = facades[(i * 2 + (side + 1) / 2) % facades.length]
      const depth = 12
      const { mesh } = new FacadeHouse({ facade, width: street.length, height, depth })
      mesh.position.x = side * (street.half - 5 + depth / 2)
      mesh.position.z = street.from + i * (street.length + street.gap)
      // its front, +z, to the street
      mesh.rotation.y = -side * Math.PI / 2
      physics.add(mesh, 0)
    }

  // the square, built round but where the street comes in, at half a turn
  square.houses.forEach((turn, i) => {
    const angle = Math.PI * turn
    const height = THREE.MathUtils.randFloat(...street.height)
    const { mesh } = new FacadeHouse({ facade: facades[i % facades.length], width: 16, height, depth: 10 })
    const distance = square.radius + 8
    mesh.position.x = Math.sin(angle) * distance
    mesh.position.z = square.z + Math.cos(angle) * distance
    // its front, +z, to the middle of the square
    mesh.rotation.y = angle + Math.PI
    physics.add(mesh, 0)
  })

  // the church, its tower and door toward the monument, solid as its walls
  const church = new Church().mesh
  church.scale.multiplyScalar(square.church.scale)
  const churchSize = new THREE.Box3().setFromObject(church).getSize(new THREE.Vector3())
  const churchAngle = Math.PI * square.church.turn, churchDistance = square.radius + churchSize.z / 2
  solid(church, churchSize, { x: Math.sin(churchAngle) * churchDistance, z: square.z + Math.cos(churchAngle) * churchDistance }, churchAngle)

  // the court, its front, +z, with the door to the middle of the square
  const court = new TownHouse(courtKind).mesh
  const courtSize = new THREE.Box3().setFromObject(court).getSize(new THREE.Vector3())
  const courtAngle = Math.PI * square.court.turn, courtDistance = square.radius + courtSize.z / 2
  solid(court, courtSize, { x: Math.sin(courtAngle) * courtDistance, z: square.z + Math.cos(courtAngle) * courtDistance }, courtAngle + Math.PI)

  for (const z of barricades)
    for (const side of barricade.across) {
      const { mesh } = new Barricade()
      mesh.position.x = side * Barricade.width
      mesh.position.z = z
      physics.add(mesh, barricade.mass)
    }

  const concrete = concreteMaterial()
  for (const { x, z, length, courses, turn } of blockWalls)
    for (const place of wallCourses(length, courses)) {
      const { mesh } = new ConcreteBlock(concrete)
      mesh.position.set(x + Math.cos(turn) * place.x, place.y, z - Math.sin(turn) * place.x)
      mesh.rotation.y = turn
      physics.add(mesh, ConcreteBlock.mass)
    }
  return { gunVisuals }
}
