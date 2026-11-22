import * as THREE from 'three'
import Character from '/core/gameplay/bodies/characters/Character.js'
import { createMaterial as createLavaMaterial } from '/core3d/shaders/lava.js'
import { getMesh } from '/core3d/helpers.js'
import { FPS } from '/core/constants.js'
import CharacterModel, { modelSize } from './CharacterModel.js'

const skins = {
  STONE: 'STONE',
  LAVA: 'LAVA',
  DISCO: 'DISCO'
}
const { STONE, LAVA, DISCO } = skins

/**
 * What each skin can do: how long one jump pushes it up, in seconds (a disco ball flies as long as jump is held), and
 * whether lava burns it.
 */
export const avatarAbilities = {
  STONE: { maxLift: .66, immuneToLava: false },
  LAVA: { maxLift: .66, immuneToLava: true },
  DISCO: { maxLift: Infinity, immuneToLava: false },
}

/** An avatar is as quick as its size, and its jump pushes it harder than a person's. */
export const avatar = { speedPerSize: 4, lift: 42 * 1.8 }

const createMaterial = skin => {
  if (skin === STONE) return new THREE.MeshStandardMaterial({
    map: new THREE.TextureLoader().load('/assets/images/textures/terrain/snow.jpg')
  })
  if (skin === LAVA) return createLavaMaterial()
  return new THREE.MeshNormalMaterial()
}

const chooseGeometry = skin => {
  if (skin === STONE) return THREE.DodecahedronGeometry
  if (skin === LAVA) return THREE.SphereGeometry
  if (skin === DISCO) return THREE.SphereGeometry
  return THREE.SphereGeometry
}

export function createAvatar({ skin = STONE, r = 1.2 } = {}) {
  const group = new THREE.Group()
  const Geometry = chooseGeometry(skin)
  const material = createMaterial(skin)

  const bodyGeo = new Geometry(r * .66)
  const body = new THREE.Mesh(bodyGeo, material)
  body.position.set(0, r, 0)
  group.add(body)

  const limbGeo = bodyGeo.clone().scale(.6, .6, .6)
  const rightHand = new THREE.Mesh(limbGeo, material)
  rightHand.position.set(-r, r, 0)
  rightHand.name = 'rightHand'
  group.add(rightHand)

  const leftHand = new THREE.Mesh(limbGeo, material)
  leftHand.position.set(r, r, 0)
  leftHand.name = 'leftHand'
  group.add(leftHand)

  const rightLeg = new THREE.Mesh(limbGeo, material)
  rightLeg.position.set(r / 2, r * .3, 0)
  rightLeg.name = 'rightLeg'
  group.add(rightLeg)

  const leftLeg = new THREE.Mesh(limbGeo, material)
  leftLeg.position.set(-r / 2, r * .3, 0)
  leftLeg.name = 'leftLeg'
  group.add(leftLeg)

  return group
}

/**
 * How an avatar looks and sounds: its ball body and limbs, swinging its limbs as it walks or runs, stretching them up
 * in the air and swaying them at rest, its lava skin glowing; and the steps and thuds of any character. It only reads
 * the body.
 */
export class AvatarModel extends CharacterModel {
  constructor(body, { mesh, skin }) {
    super(body, { mesh })
    this.limbs = ['leftHand', 'rightHand', 'leftLeg', 'rightLeg'].map(name => this.mesh.getObjectByName(name))
    this.lava = skin === LAVA ? getMesh(this.mesh).material : null
    this.time = 0
  }

  idle(dt) {
    const range = .09
    this.limbs.forEach(({ position }) => {
      position.z = position.z > range ? position.z * Math.pow(.9, dt * FPS) : Math.sin(this.time) * range
    })
  }

  walk(running) {
    const time = Math.sin(this.time * (running ? 9 : 6)) * this.body.size.height * .5
    const elapsed = Math.sin(time) * .666
    this.limbs.forEach((limb, i) => {
      limb.position.z = i % 2 ? elapsed : -elapsed
    })
  }

  jump() {
    this.limbs.forEach(limb => {
      limb.position.z = this.body.size.height * .3
    })
  }

  update(dt, t) {
    super.update(dt, t)
    const { body } = this
    this.time += dt
    if (body.airborne) this.jump()
    else if (body.state === 'move') this.walk(body.running)
    else this.idle(dt)
    if (this.lava) this.lava.uniforms.time.value += .8 * dt
  }
}

/** An avatar of `skin`, `size` big: a character body as big as its model and the model that shows it. */
export default function makeAvatar({ skin = STONE, size = 1, ...options } = {}) {
  const mesh = createAvatar({ skin, r: size })
  const ability = avatarAbilities[skin] ?? avatarAbilities[STONE]
  const body = new Character({ size: modelSize(mesh), speed: size * avatar.speedPerSize, jumping: 'fly',
    maxLift: ability.maxLift, lift: avatar.lift, ...options })
  return { body, model: new AvatarModel(body, { mesh, skin }) }
}
