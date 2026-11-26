import { Box3, DirectionalLight, Group, HemisphereLight, PerspectiveCamera, Scene, Vector3 } from 'three'
import { loadedModel } from '/core3d/assets/models.js'

const weaponKind = firearm => firearm.automatic ? 'machineGun' : 'rifle'

const forward = new Vector3(0, 0, -1)
const aimPoint = new Vector3(0, 0, -12)

/** Put the model's muzzle at the view's pivot, with the stock trailing offscreen. */
function heldModel(description, length) {
  const model = loadedModel(description).clone(true)
  const bounds = new Box3().setFromObject(model, true)
  const depth = bounds.max.z - bounds.min.z
  const tip = new Box3(), point = new Vector3()
  const front = bounds.max.z - depth * .009
  model.traverse(part => {
    if (!part.isMesh) return
    const { position } = part.geometry.attributes
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i).applyMatrix4(part.matrixWorld)
      if (point.z >= front) tip.expandByPoint(point)
    }
  })
  const center = tip.getCenter(new Vector3())
  model.position.set(-center.x, -center.y, -bounds.max.z)
  const held = new Group().add(model)
  held.scale.setScalar(length / depth)
  held.rotation.y = Math.PI
  return held
}

/** The weapon is drawn over the world with its own camera, so a nearby wall cannot clip its barrel. */
export default class WeaponView {
  constructor(player, firearm, { rifle, machineGun }) {
    this.player = player
    this.firearm = firearm
    this.shots = player.shotsFired
    this.kick = 0
    this.elapsed = 0
    this.sway = 0
    this.direction = new Vector3()
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(49, 1, .05, 8)
    const light = new DirectionalLight(0xffe8c8, 2.5)
    light.position.set(-1, 2, 1)
    this.pose = new Group()
    this.models = { rifle: heldModel(rifle, 1.09), machineGun: heldModel(machineGun, 1.2) }
    this.pose.add(...Object.values(this.models))
    this.scene.add(this.pose, new HemisphereLight(0xfff5e3, 0xa69a8a, 2), light)
    this.update(0)
  }

  update(dt) {
    const { player } = this
    const firearm = this.firearm()
    const kind = weaponKind(firearm)
    this.models.rifle.visible = kind === 'rifle'
    this.models.machineGun.visible = kind === 'machineGun'
    const fired = player.shotsFired > this.shots
    this.kick = fired ? 1 : Math.max(0, this.kick - 11 * dt)
    this.shots = player.shotsFired
    this.elapsed += dt
    const stride = Math.min(1, Math.hypot(player.vx, player.vz) / 3)
    this.sway = Math.sin(this.elapsed * (stride > .1 ? 10 : 2)) * (.002 + stride * .009)
    this.reload = firearm.reloading ? Math.sin(Math.PI * firearm.readiness) : 0
    this.place()
  }

  place() {
    const { pose, direction } = this
    const across = .15 * Math.min(1, this.camera.aspect / .9)
    pose.position.set(across + this.sway, -.285 + this.sway - this.reload * .12, -.99)
    direction.subVectors(aimPoint, pose.position).normalize()
    pose.quaternion.setFromUnitVectors(forward, direction)
    // Recoil travels backwards along the same line, keeping the bore pointed at the reticle.
    pose.position.addScaledVector(direction, -this.kick * .051)
  }

  render(renderer, aspect) {
    if (this.camera.aspect !== aspect) {
      this.camera.aspect = aspect
      this.camera.updateProjectionMatrix()
      this.place()
    }
    const { autoClear } = renderer
    const { autoReset } = renderer.info
    renderer.autoClear = renderer.info.autoReset = false
    try {
      renderer.clearDepth()
      renderer.render(this.scene, this.camera)
    } finally {
      renderer.autoClear = autoClear
      renderer.info.autoReset = autoReset
    }
  }
}
