import * as THREE from 'three'
import { createTexture } from '/core3d/helpers.js'
import { bankHeight } from './Canyon.js'
import { infantryWeapons, riflemanModel, variants } from '/core3d/actor/derived/ww2/partisanLooks.js'
import makeInfantryFighter from './InfantryFighter.js'

const gunfireProfile = {
  nearDistance: 4, fadeStart: 25, maxDistance: 40, farCutoff: 1100,
  pitchRange: [.97, 1.03], volumeRange: [.9, 1], priority: 60,
  budgetKey: 'ally-gunfire', maxVoices: 10,
}

/**
 * How likely a rifle shot brings down a defender it can reach: a gunner at his narrow slit, or one the gun has bared
 * by breaching the wall in front of him. Behind whole masonry no shot reaches him.
 */
export const allyFire = { slit: .006, open: .03 }
/** How likely a burst that sweeps the flank brings down the fighter it is aimed at, by his cover. */
export const exposure = { logs: .3, stone: .3, open: .7 }

const positions = [
  { x: -7.5, z: .4, cover: 'logs', fighters: [
    variants.strelac,
    variants.smedji,
  ] },
  { x: 7.1, z: .15, cover: 'stone', fighters: [
    variants.mitraljezac,
    variants.vuna,
  ] },
  { x: -6.5, z: -1.8, cover: 'stone', fighters: [
    variants.indigo,
    variants.zimski,
  ] },
  { x: 4.8, z: -2.6, cover: 'logs', fighters: [
    variants.maslinasti,
    variants.brkovi,
  ] },
  { x: -4.45, z: -2.85, cover: 'logs', fighters: [
    variants.sivi,
    variants.oker,
  ] },
  // a rifleman beside the gun, in the open
  { x: -2.25, z: -.35, fighters: [{ model: riflemanModel, weapon: infantryWeapons.rifle }] },
]

function buildCover(scene, scope, scenery, logs, stones) {
  function place(geometry, file, color, transforms) {
    const map = createTexture({ file })
    map.colorSpace = THREE.SRGBColorSpace
    const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshLambertMaterial({ map, color }), transforms.length)
    transforms.forEach((matrix, i) => mesh.setMatrixAt(i, matrix))
    scenery.addInstances(mesh, scale => geometry.type === 'CylinderGeometry' ? 3 * scale.x : 80 * scale.x * scale.y * scale.z)
    mesh.castShadow = mesh.receiveShadow = true
    scene.add(mesh)
    scope.add(() => mesh.dispose())
  }
  const wood = new THREE.CylinderGeometry(.14, .16, 1, 9)
  wood.rotateZ(Math.PI / 2)
  place(wood, 'material/qubodup-light_wood.jpg', 0x79674f, logs)
  place(new THREE.DodecahedronGeometry(1), 'terrain/rocks.jpg', 0xb1ac98, stones)
}

export default class Infantry {
  constructor(scene, scope, posts, scenery) {
    const logs = [], stones = []
    const textures = new Map()
    this.fighters = []
    this.elapsed = 0
    for (const [i, position] of positions.entries()) {
      const { x, z, cover, fighters } = position
      const yaw = Math.atan2(x, z + 14)
      const location = (across, forward) => {
        const px = x + across * Math.cos(yaw) - forward * Math.sin(yaw)
        const pz = z - across * Math.sin(yaw) - forward * Math.cos(yaw)
        return new THREE.Vector3(px, bankHeight(px, pz), pz)
      }
      const piece = new THREE.Object3D()
      if (cover === 'logs')
        for (let row = 0; row < 3; row++) {
          piece.position.copy(location(.06 * (row - 1), .56 + .07 * row))
          piece.position.y += .15 + row * .29
          piece.rotation.set(.08 * row, yaw + .035 * row, .025 * (i - 2), 'YXZ')
          piece.scale.set(2.5 - row * .09, 1, 1)
          piece.updateMatrix()
          logs.push(piece.matrix.clone())
        }
      else if (cover === 'stone')
        for (let row = 0; row < 2; row++)
          for (let j = 0; j < 5 - row; j++) {
            piece.position.copy(location((j - 2 + row / 2) * .53, .68 + .07 * Math.sin(j)))
            piece.position.y += .21 + row * .34
            piece.rotation.set(.18 * Math.sin(j + i), yaw + j * 1.7, .12 * Math.cos(i + j))
            piece.scale.set(.4, .26 + .035 * Math.sin(j), .35)
            piece.updateMatrix()
            stones.push(piece.matrix.clone())
          }

      for (const [j, look] of fighters.entries()) {
        const fighter = makeInfantryFighter(look, posts, textures)
        fighter.cover = cover ?? 'open'
        scene.add(fighter.mesh)
        const across = fighters.length === 2 ? (j ? .64 : -.64) : (j - (fighters.length - 1) / 2) * .78
        fighter.place(location(across, j % 2 ? -.12 : 0), bankHeight, this.fighters.length)
        this.fighters.push(fighter)
      }
    }
    buildCover(scene, scope, scenery, logs, stones)
  }

  pickTarget() {
    const living = this.fighters.filter(fighter => fighter.alive)
    return living[Math.floor(Math.random() * living.length)]
  }

  /** The shots its fighters fire now, `{ from, post }` each, with their sound. */
  update(dt, audio) {
    this.elapsed += dt
    if (this.elapsed < 1 / 15) return []
    const shots = []
    for (const fighter of this.fighters) {
      const shot = fighter.update(this.elapsed)
      if (!shot) continue
      shots.push(shot)
      const burst = fighter.rounds > 1
      audio?.emit(burst ? 'rifle-burst.mp3' : 'rifle.mp3', {
        profile: gunfireProfile, spatial: { position: shot.from },
      })
    }
    this.elapsed = 0
    return shots
  }
}
