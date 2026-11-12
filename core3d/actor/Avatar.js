import * as THREE from 'three'
import Player from './Player.js'
import { createMaterial as createLavaMaterial } from '/core3d/shaders/lava.js'
import { getMesh } from '/core3d/helpers.js'
import { jumpStyles } from '/core3d/constants.js'
import { FPS } from '/core/konstante.js'

const skins = {
  STONE: 'STONE',
  LAVA: 'LAVA',
  DISCO: 'DISCO'
}
const { STONE, LAVA, DISCO } = skins

export const avatarAbilities = {
  STONE: { jumpStyle: jumpStyles.FLY_JUMP, immuneToLava: false },
  LAVA: { jumpStyle: jumpStyles.FLY_JUMP, immuneToLava: true },
  DISCO: { jumpStyle: jumpStyles.FLY, immuneToLava: false },
}

/** Visual pose belongs to one avatar, so waiting in another scene cannot advance it. */
class AvatarPose {
  constructor(mesh, height, skin) {
    this.height = height
    this.time = 0
    this.limbs = ['leftHand', 'rightHand', 'leftLeg', 'rightLeg'].map(name => mesh.getObjectByName(name))
    this.lava = skin === LAVA ? getMesh(mesh).material : null
  }

  idle(dt) {
    const range = .09
    this.limbs.forEach(({ position }) => {
      position.z = position.z > range ? position.z * Math.pow(.9, dt * FPS) : Math.sin(this.time) * range
    })
  }

  walk(name) {
    const time = Math.sin(this.time * (name === 'run' ? 9 : 6)) * this.height * .5
    const elapsed = Math.sin(time) * .666
    this.limbs.forEach((limb, i) => {
      limb.position.z = i % 2 ? elapsed : -elapsed
    })
  }

  jump() {
    this.limbs.forEach(limb => {
      limb.position.z = this.height * .3
    })
  }

  update(dt, state, jump) {
    this.time += dt
    if (state === 'walk' || state === 'run') this.walk(state)
    else if (jump) this.jump()
    else this.idle(dt)
    if (this.lava) this.lava.uniforms.time.value += .8 * dt
  }
}

const createMaterial = skin => {
  if (skin == STONE) return new THREE.MeshStandardMaterial({
    map: new THREE.TextureLoader().load('/assets/images/textures/terrain/snow.jpg')
  })
  if (skin == LAVA) return createLavaMaterial()
  return new THREE.MeshNormalMaterial()
}

const chooseGeometry = skin => {
  if (skin == STONE) return THREE.DodecahedronGeometry
  if (skin == LAVA) return THREE.SphereGeometry
  if (skin == DISCO) return THREE.SphereGeometry
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

/** CLASS */

export default class Avatar extends Player {
  constructor({
    skin = STONE,
    jumpStyle = (avatarAbilities[skin] || avatarAbilities.STONE).jumpStyle,
    maxJumpTime = .66,
    size = 1,
    speed = size * 4,
    showHealthBar = false,
    useComposedMovement = true,
    ...params
  } = {}) {
    super({
      mesh: createAvatar({ skin, r: size }),
      speed,
      jumpStyle,
      maxJumpTime,
      showHealthBar,
      useComposedMovement,
      animDict: { jump: true },
      ...params,
    })
    this.skin = skin
    this.jumpForce = this.gravity * 1.8
    if (this.chaseCamera) {
      this.chaseCamera.speed = 4
      this.chaseCamera.distance = 4
    }
    this.pose = new AvatarPose(this.mesh, this.height, skin)
    this.limbs = this.pose.limbs
  }

  get immuneToLava() {
    return Boolean(avatarAbilities[this.skin]?.immuneToLava)
  }

  idleAnim(dt = 1 / FPS) {
    this.pose.idle(dt)
  }

  walkAnim(name) {
    this.pose.walk(name)
  }

  jumpAnim() {
    this.pose.jump()
  }

  update(delta = 1 / FPS) {
    super.update(delta)
    this.pose.update(delta, this.fsm.stateName, this.input.jump)
  }
}
