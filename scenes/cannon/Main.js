import Scene3D from '/core/Scene3D.js'
import PhysicsWorld from '/core3d/physics/PhysicsWorld.js'
import { Snow } from '/core3d/Particles.js'
import { createMetalBarrel, createSphere } from '/core3d/geometry/index.js'
import * as THREE from 'three'
import { aimRate, description as cannon, models as cannonModels } from '/core3d/actor/derived/Cannon.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import Sound from '/core/io/audio/SoundSource.js'
import { Ammo } from '/core3d/physics/index.js'
import PowerMeter from '/ui/PowerMeter.js'
import { requestModels } from '/core3d/assets/models.js'
import { keys } from '/core/io/keys.js'
import { icons } from '/core/io/icons.js'
import { bankHeight, buildCanyon } from './Canyon.js'
import { buildFort } from './Fort.js'
import { clearFortPath } from './fortPath.js'
import FortPhysics from './FortPhysics.js'
import SceneryPhysics from './SceneryPhysics.js'
import Garrison from './Garrison.js'
import FortFlag from './FortFlag.js'
import Blasts from './Blasts.js'
import Shell from './Shell.js'
import SmokeTrail from './SmokeTrail.js'
import Defenders, { defenderModels } from './Defenders.js'
import { gunner } from './Gunner.js'
import Crew, { memberHealth, models as crewModels, stations } from '/core3d/actor/artillery/Crew.js'
import GunHit from '/core3d/actor/artillery/GunHit.js'
import Infantry, { allyFire, exposure } from './Infantry.js'
import { infantryModels } from '/core3d/actor/derived/ww2/partisanLooks.js'
import Tracers from './Tracers.js'
import SurrenderChoice from './SurrenderChoice.js'
import ScorchMarks from './ScorchMarks.js'

/** The fort faces the gun on the same bank, with barrels in front of the wall. */
const fortFront = -13
const barrels = [[-5.5, fortFront + 1.2], [-4.8, fortFront + 1.6], [4.6, fortFront + 1.4]]
/** How far a shell's blast reaches, in metres, and how hard it throws what stands at its heart, in newton-seconds. */
const blast = { radius: 1.3, strength: 8 }
/** Machine-gun fire remains forceful across the short battlefield. */
const enemyBurstProfile = {
  nearDistance: 8, fadeStart: 35, maxDistance: 50, farCutoff: 900,
  pitchRange: [.98, 1.02], volumeRange: [.95, 1], maxVoices: 6,
}
/** How far around the gun a missing burst lands, in metres. */
const missBy = 2.5

// Follow part of the barrel's rise so the player can see it tilt against the fort.
const cameraAimHeight = body => body.y + body.aim.y * 9

const controlKeys = {
  '← or A': 'left',
  '→ or D': 'right',
  [keys.up.label]: 'raise the barrel',
  [keys.down.label]: 'lower the barrel',
  [`Mouse or ${keys.jump.label}`]: 'shoot',
}

export default class CannonScene extends Scene3D {
  constructor() {
    super({
      intro: 'Shell the Italian fort until its garrison surrenders.',
      reportText: 'Jablanica, February 1943\n\nItalian troops hold the old Austrian barracks above the Neretva. The partisan guns are ready to open fire.',
      canvasBackground: 'linear-gradient(#8499a5, #c7d1d6 70%, #d8dede)',
      controlKeys,
    })
  }

  async init() {
    await requestModels([...new Set([...cannonModels, ...crewModels, ...infantryModels, ...defenderModels])], { parallelAnimations: true })
    // the keyboard also tracks a held pointer, which charges the shot on touch screens too; the fire button there
    // stands for Space, held to charge and let go to fire
    // it faces the fort, down -z
    const { body, model, keys, chase } = leadCharacter(this, cannon, { yaw: Math.PI / 2, health: stations.length * memberHealth,
      input: { useKeyboard: true, buttonDict: { jump: icons.shoot } },
      view: { showCameraButton: false } })
    Object.assign(this, { player: body, cannon: model, input: keys.input })
    this.aimCamera = chase.view.chaseCamera
    this.aimCamera.setCamera(0)
    this.aimCamera.lookAt = [0, cameraAimHeight(body), -16]
    this.aimCamera.speed = 14
    this.camera.fov = 64
    this.camera.near = .04
    this.camera.updateProjectionMatrix()
    this.barrel = model.mesh.getObjectByName('Elevation')
    this.barrel.rotation.x = body.pitch
    this.muzzle = this.barrel.getObjectByName('Muzzle')
    this.shellRadius = this.muzzle.userData.boreRadius
    const sight = model.mesh.worldToLocal(this.barrel.getWorldPosition(new THREE.Vector3()))
    this.aimCamera.offset[0] = this.aimCamera.lookAt[0] = sight.x
    this.aimCamera.height = sight.y + .95
    this.aimCamera.distance = sight.z + 4.2
    chase.update(0)
    this.add(new GunHit(body, model.mesh))
    this.crew = new Crew(model.mesh)
    this.crewMeter = chase.view.healthBar
    this.crewMeter.dataset.cannonMeter = 'health'
    this.crewMeter.title = 'Crew health'
    this.crewMeter.setAttribute('aria-label', 'Crew health')
    this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: { getPosition: () => this.shotPoint } })
    model.sounds.push(this.shotSound)
    model.audioScene?.output.preload('rafal.mp3')
    model.audioScene?.output.preload('rifle.mp3')
    model.audioScene?.output.preload('rifle-burst.mp3')
    this.power = new PowerMeter({ min: 10, max: 25, chargePerSecond: 12 })
    this.power.element.dataset.cannonMeter = 'power'
    this.power.element.setAttribute('aria-label', 'Shot power')
    this.power.element.title = 'Shot power'
    this.session.scope.add(() => this.power.end())
    this.surrender = new SurrenderChoice(this)

    this.physics = new PhysicsWorld({ scene: this.scene })
    this.session.scope.add(() => this.physics.dispose())
    this.scenery = new SceneryPhysics(this.physics)
    this.session.scope.add(() => this.scenery.end())
    buildCanyon({ scene: this.scene, physics: this.physics, scenery: this.scenery, scope: this.session.scope, fortFront })
    const snow = new Snow({ num: 240, size: .07, opacity: .65, minRadius: 8, maxRadius: 14,
      minVelocity: .45, maxVelocity: 1.1, blending: THREE.NormalBlending, pos: { x: 0, y: 1, z: -8 } })
    const flakes = snow.mesh.geometry.attributes.position
    const drift = { min: -1, max: 12, rotateY: 0 }
    for (let i = 0; i < flakes.count; i++) flakes.setY(i, THREE.MathUtils.lerp(drift.min, drift.max, i / flakes.count))
    this.add({ mesh: snow.mesh, update(dt, t) {
      drift.rotateY = .035 * dt
      snow.update(dt, t, drift)
    } })

    const fort = buildFort({ front: fortFront, base: bankHeight(0, fortFront) })
    this.stones = fort.parts
    this.fortFront = fortFront
    this.defenders = new Defenders(this.scene, this.physics, fort.slits, fortFront, this.stones)
    this.posts = this.defenders.posts
    this.infantry = new Infantry(this.scene, this.session.scope, this.posts, this.scenery)
    this.fortPhysics = new FortPhysics({ parts: this.stones, physics: this.physics })
    this.garrison = new Garrison(this.defenders.living)
    this.barrels = barrels.map(([x, z]) => createMetalBarrel({ r: .3, height: .9, translateHeight: false,
      pos: { x, y: bankHeight(x, z) + .45, z } }))
    this.barrels.forEach(mesh => this.scenery.add(mesh, 12))
    this.flag = new FortFlag({ x: 5.4, z: fortFront - 1.6 })
    this.flag.mesh.position.y += bankHeight(this.flag.mesh.position.x, this.flag.mesh.position.z)
    this.physics.add(this.flag.mesh, 0)
    this.blasts = new Blasts(this.scene)
    this.session.scope.add(() => this.blasts.end())
    this.scorches = new ScorchMarks(this.scene)
    this.session.scope.add(() => this.scorches.end())
    this.smoke = new SmokeTrail(this.scene)
    this.session.scope.add(() => this.smoke.end())
    this.tracers = new Tracers(this.scene, point => this.smoke.puff(point))
    this.session.scope.add(() => this.tracers.end())
    this.impacts = []
    this.shells = []
    this.queuedShot = false
    // Terrain and intact masonry do not need their matrices rebuilt every frame.
    for (const mesh of this.physics.rigidBodies) {
      if (!mesh.isMesh || !mesh.userData.body.isStaticOrKinematicObject()) continue
      mesh.updateWorldMatrix(true, true)
      mesh.matrixAutoUpdate = mesh.matrixWorldAutoUpdate = false
    }
  }

  handleClick(e) {
    const action = e.target.closest('button')?.id
    if (action === 'accept-surrender') return this.surrender.resolve(true)
    if (action === 'reject-surrender') return this.surrender.resolve(false)
    if (e.target.closest('button, input, progress')) return
    this.fire()
  }

  /** A click or a released Space fires the charged shot while the game runs. */
  fire() {
    if (!this.gameLoop.isRunning || this.session.state !== 'running' || this.ui.screen || this.ui.outro || this.player.dead) return
    if (!this.crew.ready) {
      this.queuedShot = true
      return
    }
    this.queuedShot = false
    this.shoot()
  }

  /** A shell flies from the muzzle the way the barrel points, as hard as the power charged. */
  shoot() {
    if (this.surrender.ceasefire || this.player.dead || !this.crew.ready) return
    const { physics } = this
    this.cannon.audioScene?.output.preload('explosion.mp3')
    const ball = createSphere({ r: .12 })
    ball.visible = false
    this.barrel.rotation.x = this.player.pitch
    this.muzzle.getWorldPosition(ball.position)
    const way = this.muzzle.getWorldDirection(new THREE.Vector3())
    physics.add(ball, 1)
    ball.userData.body.setCcdMotionThreshold(.1)
    ball.userData.body.setCcdSweptSphereRadius(.1)
    this.shotPoint = ball.position.clone()
    this.shotSound.play()
    this.crew.fired()
    physics.contacts.once(ball.userData.body, (point, other) => this.impacts.push({ ball, point, other }))
    way.multiplyScalar(this.power.value)
    const velocity = new Ammo.btVector3(way.x, way.y, way.z)
    ball.userData.body.setLinearVelocity(velocity) // the body copies it
    Ammo.destroy(velocity)
    const shell = new Shell(ball, this.shellRadius)
    this.addMesh(shell.mesh)
    this.shells.push(shell)
    this.power.reset()
  }

  /** The shell bursts where it strikes and throws the stones and barrels near the burst away from it. */
  explode(point) {
    const heart = new THREE.Vector3(point.x, point.y, point.z)
    if (!this.surrender.accepted) this.defenders.blast(heart, blast.radius, [...this.fortPhysics.fixed])
    this.blasts.add(heart, 3)
    this.scorches.add(heart, this.stones)
    this.cannon.audioScene?.emit('explosion.mp3', { profile: 'explosion', spatial: { position: heart } })
    this.fortPhysics.hit(heart, blast.radius)
    this.scenery.hit(heart, blast.radius, blast.strength)
    for (const mesh of this.stones) {
      const away = mesh.position.clone().sub(heart)
      const distance = away.length()
      if (distance >= blast.radius) continue
      away.normalize().setY(away.y + .3).multiplyScalar(blast.strength * (1 - distance / blast.radius))
      const impulse = new Ammo.btVector3(away.x, away.y, away.z)
      mesh.userData.body.applyCentralImpulse(impulse)
      Ammo.destroy(impulse)
    }
  }

  /** Removes a shell and bursts it at its point of impact. */
  detonate(shell, point) {
    this.explode(point)
    this.physics.remove(shell.ball)
    this.removeMesh(shell.mesh)
    this.shells.splice(this.shells.indexOf(shell), 1)
  }

  /** Each surviving machine gun fires from its post. */
  fireBack(dt) {
    const { player } = this
    for (const post of this.posts) {
      if (post.destination) continue
      const burst = post.gunner.update(dt, player.alive)
      if (!burst) continue
      const member = burst.hit ? this.crew.pickTarget() : null
      // Some bursts that miss the crew sweep the flanks instead.
      const ally = !burst.hit && post.gunner.random() < .4 ? this.infantry.pickTarget() : null
      const allyHit = ally && post.gunner.random() < exposure[ally.cover]
      const chest = member?.pose.chest ?? ally?.chest
      const target = chest
        ? chest.getWorldPosition(new THREE.Vector3())
        : new THREE.Vector3(player.x + THREE.MathUtils.randFloatSpread(2 * missBy), 0, player.z + THREE.MathUtils.randFloatSpread(2 * missBy))
      const grip = post.fighter.gun.grip.rifle.getWorldPosition(new THREE.Vector3())
      if (!clearFortPath(grip, post.position, this.stones) || !clearFortPath(post.position, target, this.stones)) continue
      this.tracers.burst(post.position, target, post.rounds === 1 ? 1 : undefined)
      if (allyHit) ally.fall()
      this.cannon.audioScene?.emit(post.rounds === 1 ? 'rifle.mp3' : 'rafal.mp3', { profile: enemyBurstProfile, spatial: { position: post.position } })
      if (member) {
        const damage = Math.min(member.health.current, gunner.damage)
        this.crew.hit(member, damage, this.scene)
        player.takeHit(damage)
        this.crewMeter.value = player.health.current
      }
    }
  }

  /** A shot of the flank that reaches its defender brings him down now and then, more often once his wall is breached. */
  alliedFire(shots) {
    for (const { from, post } of shots) {
      if (!post.fighter.alive || !clearFortPath(from, post.position, this.stones)) continue
      const atSlit = post.slit && !post.destination
      if (Math.random() < (atSlit ? allyFire.slit : allyFire.open)) this.defenders.kill(post)
    }
  }

  pause() {
    if (this.surrender?.pending) return
    super.pause()
  }

  unpause() {
    if (this.surrender?.pending) return this.surrender.show()
    super.unpause()
  }

  update(dt, t) {
    if (this.surrender.pending) return
    if (this.surrender.ceasefire) this.queuedShot = false
    this.player.look(0, aimRate * dt * ((this.input.up ? 1 : 0) - (this.input.down ? 1 : 0)))
    if (this.aimCamera) this.aimCamera.lookAt[1] = cameraAimHeight(this.player)
    super.update(dt, t)
    this.barrel.rotation.x = this.player.pitch
    // the mouse button or Space, held, charges the shot; Space, released, fires it
    const spaceHeld = this.input.jump
    if (this.input.pressed.pointer || spaceHeld) this.power.charge(dt)
    if (this.spaceHeld && !spaceHeld) this.fire()
    this.spaceHeld = spaceHeld
    this.crew.update(dt, (this.power.value - this.power.min) / (this.power.max - this.power.min),
      this.input.pressed.pointer || spaceHeld || this.queuedShot)
    if (this.queuedShot && this.crew.ready) this.fire()

    this.physics.update(dt)
    this.scenery.sync()
    this.shells.forEach(shell => shell.update())
    // Body reinsertion must wait until native contact dispatch has finished.
    this.impacts.splice(0).forEach(({ ball, point, other }) => {
      const shell = this.shells.find(flying => flying.ball === ball)
      if (!shell) return
      if (!this.surrender.accepted) this.defenders.hit(other)
      this.detonate(shell, point)
    })
    this.smoke.update(dt)
    this.blasts.update()
    this.defenders.update(dt)
    if (!this.player.dead && this.surrender.accepted && this.defenders.prisonersReady)
      return this.victory('The garrison has surrendered.', 'Bravo!')
    if (!this.player.dead && !this.defenders.living) return this.victory('The garrison has been defeated.', 'Bravo!')
    this.flag.update(dt)
    this.surrender.update()
    if (this.surrender.pending) return
    if (!this.surrender.ceasefire) {
      this.alliedFire(this.infantry.update(dt, this.cannon.audioScene))
      this.fireBack(dt)
    }
    this.tracers.update(dt)

    // the battle is lost once the last of the crew lies on the ground, so his fall plays out
    if (this.player.dead && this.crew.members.every(member => !member.fallMixer)) this.defeat('Your gun crew has been killed.')
  }
}
