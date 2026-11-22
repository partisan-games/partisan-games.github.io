import * as THREE from 'three'
import { Ammo, createRigidBody } from '/core3d/physics/index.js'
import { italianLooks } from '/core3d/actor/derived/ww2/italianLooks.js'
import makeInfantryFighter from './InfantryFighter.js'
import Gunner from './Gunner.js'
import { bankHeight } from './Canyon.js'
import { clearFortPath } from './fortPath.js'

const infantry = [
  [-3.95, -2.45, italianLooks.rifle], [-.9, -3.1, italianLooks.berthier], [.65, -4.15, italianLooks.mp40],
  [2.5, -2, italianLooks.rifleCoat], [4.15, -3.1, italianLooks.mp40Bag], [2.6, -4.15, italianLooks.berthierRoll],
]
export const defenderModels = [...new Set(Object.values(italianLooks).flatMap(look => [look.model, look.weapon.model]))]
const up = new THREE.Vector3(0, 1, 0)
const surrenderSpeed = 1.45
const prisonerStep = new THREE.Vector3()

// Boxes follow the firing pose. Ammo tests them as one body instead of one broad-phase entry per limb.
function hitBody(physics, origin, segments) {
  const { own } = physics
  const compound = own(new Ammo.btCompoundShape())
  for (const [a, b, width, depth] of segments) {
    const axis = b.clone().sub(a)
    const center = a.clone().lerp(b, .5).sub(origin)
    const half = new Ammo.btVector3(width / 2, axis.length() / 2, depth / 2)
    const box = own(new Ammo.btBoxShape(half))
    const rotation = new THREE.Quaternion().setFromUnitVectors(up, axis.normalize())
    const q = new Ammo.btQuaternion(rotation.x, rotation.y, rotation.z, rotation.w)
    const p = new Ammo.btVector3(center.x, center.y, center.z)
    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setRotation(q)
    transform.setOrigin(p)
    compound.addChildShape(transform, box)
    for (const temporary of [transform, p, q, half]) Ammo.destroy(temporary)
  }
  const collider = new THREE.Object3D()
  collider.position.copy(origin)
  collider.userData.body = createRigidBody({ mesh: collider, shape: compound, own, mass: 0 })
  physics.add(collider, 0)
  return collider
}

/** Defenders hold the fort and move up to vacant slits with their shell colliders. */
export default class Defenders {
  constructor(scene, physics, slits, front, stones) {
    this.physics = physics
    this.contacts = new Map()
    this.members = []
    this.posts = []
    this.slits = slits
    this.stones = stones
    this.nextRelief = 0
    this.nativePosition = physics.own(new Ammo.btVector3())
    const target = [{ position: new THREE.Vector3() }]
    const add = (position, look, slit) => {
      const fighter = makeInfantryFighter(look, target)
      scene.add(fighter.mesh)
      fighter.place(position, bankHeight)
      const { muzzle } = fighter.gun
      if (slit) {
        const offset = slit.position.clone().sub(muzzle.getWorldPosition(new THREE.Vector3()))
        fighter.mesh.position.add(offset)
      }
      const bone = name => fighter.figure.getObjectByName('mixamorig' + name).getWorldPosition(new THREE.Vector3())
      const head = bone('Head')
      const member = { fighter, gunner: new Gunner(), position: muzzle.getWorldPosition(new THREE.Vector3()),
        slit, rounds: look.weapon.rounds }
      this.members.push(member)
      this.posts.push(member)
      const segments = [[head, head.clone().addScaledVector(up, .26), .25, .24],
        [bone('Hips'), bone('Neck'), .37, .24]]
      for (const side of ['Left', 'Right']) {
        for (const [from, to, size] of [['Arm', 'ForeArm', .13], ['ForeArm', 'Hand', .12],
          ['UpLeg', 'Leg', .18], ['Leg', 'Foot', .15], ['Foot', 'ToeBase', .12]])
          segments.push([bone(side + from), bone(side + to), size, size])
        const hand = bone(side + 'Hand')
        const finger = fighter.figure.getObjectByName('mixamorig' + side + 'HandMiddle1')
        if (finger) segments.push([hand, finger.getWorldPosition(new THREE.Vector3()), .1, .08])
      }
      member.bodySegments = segments.map(([from, to, width, depth]) => ({
        line: new THREE.Line3(from, to), radius: Math.min(width, depth) / 2,
      }))
      segments.push([fighter.gun.grip.rifle.getWorldPosition(new THREE.Vector3()), member.position, .09, .09])
      member.collider = hitBody(physics, head, segments)
      this.contacts.set(Ammo.getPointer(member.collider.userData.body), member)
    }
    const gunners = [italianLooks.mg, italianLooks.mgCoat, italianLooks.mgRoll, italianLooks.mgBag]
    slits.forEach((slit, index) => add(slit.position.clone(), gunners[index % gunners.length], slit))
    for (const [x, dz, look] of infantry) {
      const z = front + dz
      add(new THREE.Vector3(x, bankHeight(x, z), z), look)
    }
  }

  get living() {
    return this.posts.length
  }

  get prisonersReady() {
    return this.surrendering && this.posts.every(member => !member.route.length)
  }

  hit(id) {
    const member = this.contacts.get(id)
    if (member) this.kill(member)
  }

  blast(point, radius, walls) {
    const closest = new THREE.Vector3()
    const ray = new THREE.Raycaster()
    for (const member of this.members) {
      if (!member.fighter.alive) continue
      const reached = member.bodySegments.some(segment => {
        segment.line.closestPointToPoint(point, true, closest)
        const distance = closest.distanceTo(point)
        if (distance > radius + segment.radius) return false
        if (distance <= segment.radius) return true
        ray.ray.origin.copy(closest)
        ray.ray.direction.subVectors(point, closest).normalize()
        ray.far = distance - .01
        return !ray.intersectObjects(walls, false).length
      })
      if (reached) this.kill(member)
    }
  }

  kill(member) {
    member.fighter.fall()
    this.contacts.delete(Ammo.getPointer(member.collider.userData.body))
    this.physics.remove(member.collider)
    this.posts.splice(this.posts.indexOf(member), 1)
  }

  surrender(front) {
    if (this.surrendering) return
    this.surrendering = true
    const survivors = this.posts.filter(member => member.fighter.alive)
    survivors.forEach((member, index) => {
      this.contacts.delete(Ammo.getPointer(member.collider.userData.body))
      this.physics.remove(member.collider)
      member.destination = null
      member.fighter.surrender()
      member.surrenderDelay = index * .3
      const from = member.fighter.mesh.position
      const side = from.x < -2.4 ? -1 : 1
      const flank = side * 6.2
      member.groundOffset = from.y - bankHeight(from.x, from.z)
      const place = (x, z) => new THREE.Vector3(x, bankHeight(x, z) + member.groundOffset, z)
      member.route = [
        place(flank, front - 5.7),
        place(flank, front + 2.4),
        place((index - (survivors.length - 1) / 2) * .8, front + 4.2),
      ]
    })
  }

  advancePrisoner(member, dt) {
    if (member.surrenderDelay > 0) {
      member.surrenderDelay -= dt
      member.fighter.updateSurrender(dt, false)
      return
    }
    const destination = member.route[0]
    if (!destination) return member.fighter.updateSurrender(dt, false)
    const step = prisonerStep.subVectors(destination, member.fighter.mesh.position)
    const distance = step.length()
    step.clampLength(0, surrenderSpeed * dt)
    member.fighter.mesh.rotation.y = Math.atan2(-step.x, -step.z)
    member.fighter.mesh.position.add(step)
    member.fighter.body.x = member.fighter.mesh.position.x
    member.fighter.body.y = member.fighter.mesh.position.y + member.fighter.body.size.height / 2
    member.fighter.body.z = member.fighter.mesh.position.z
    member.fighter.body.yaw = member.fighter.mesh.rotation.y + Math.PI / 2
    member.position.add(step)
    for (const { line } of member.bodySegments) {
      line.start.add(step)
      line.end.add(step)
    }
    if (distance <= surrenderSpeed * dt) member.route.shift()
    member.fighter.updateSurrender(dt, true)
  }

  assignRelief() {
    for (const slit of this.slits) {
      if (this.posts.some(member => member.slit === slit || member.destination === slit)) continue
      const reserves = this.posts.filter(member => !member.slit && !member.destination)
      reserves.sort((a, b) => a.position.distanceToSquared(slit.position) - b.position.distanceToSquared(slit.position))
      for (const reserve of reserves) {
        const head = reserve.collider.position
        const arrival = slit.position.clone().sub(reserve.position).add(head)
        if (!clearFortPath(head, arrival, this.stones, .14)) continue
        reserve.destination = slit
        break
      }
    }
  }

  advance(member, dt) {
    const slit = member.destination
    const step = slit.position.clone().sub(member.position)
    const distance = step.length()
    step.clampLength(0, 1.15 * dt)
    const { collider } = member
    const next = collider.position.clone().add(step)
    if (!clearFortPath(collider.position, next, this.stones, .14)) {
      member.destination = null
      return
    }
    member.fighter.mesh.position.add(step)
    member.fighter.body.x += step.x
    member.fighter.body.y += step.y
    member.fighter.body.z += step.z
    member.position.add(step)
    for (const { line } of member.bodySegments) {
      line.start.add(step)
      line.end.add(step)
    }
    collider.position.copy(next)
    const { body } = collider.userData
    const transform = body.getWorldTransform()
    this.nativePosition.setValue(next.x, next.y, next.z)
    transform.setOrigin(this.nativePosition)
    body.setWorldTransform(transform)
    body.getMotionState().setWorldTransform(transform)
    this.physics.physicsWorld.updateSingleAabb(body)
    if (distance <= 1.15 * dt) {
      member.slit = slit
      member.destination = null
      member.gunner.wait = .8
    }
  }

  update(dt) {
    if (this.surrendering) {
      for (const member of this.posts) this.advancePrisoner(member, dt)
      return
    }
    this.nextRelief -= dt
    if (this.nextRelief <= 0) {
      this.assignRelief()
      this.nextRelief = 1
    }
    for (const member of this.posts)
      if (member.destination) this.advance(member, dt)
    for (const { fighter } of this.members)
      if (!fighter.alive) fighter.update(dt)
  }
}
