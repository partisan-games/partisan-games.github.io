import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { makeCharacterBody } from '/core3d/actor/characters/makeCharacter.js'
import dressFighter from '/core3d/actor/characters/dressFighter.js'
import { loadedModel } from '/core3d/assets/models.js'
import { infantryBody, regular, riflemanModel } from '/core3d/actor/derived/ww2/partisanLooks.js'
import Rifleman from './Rifleman.js'
import { poseSurrender, surrenderArms } from '/core3d/actor/characters/surrenderPose.js'

function compatibleClip(clip, figure) {
  const tracks = clip.tracks.filter(track => figure.getObjectByName(track.name.split('.')[0]))
  return new THREE.AnimationClip(clip.name, clip.duration, tracks)
}

class InfantryFighter {
  constructor(body, source, { weapon, outfit, hatColor, equip, stature = 1 }, posts, textures) {
    this.body = body
    this.mesh = new THREE.Group()
    this.figure = clone(source)
    dressFighter(this.figure, outfit, textures, hatColor)
    this.figure.scale.multiplyScalar(stature)
    this.mesh.add(this.figure)
    equip?.(this.figure)
    const clips = loadedModel(riflemanModel).userData.animations
    const action = weapon.rounds > 1 ? 'burst' : 'fire'
    const clip = compatibleClip(clips.find(item => item.name === riflemanModel.animDict[action]), this.figure)
    this.gun = new Rifleman(this.figure, clip, weapon.model)
    const death = clips.find(item => item.name === 'Crouch Death')
      ?? loadedModel(regular).userData.animations.find(item => item.name === regular.animDict.death)
    this.deathClip = compatibleClip(death, this.figure)
    const walk = loadedModel(regular).userData.animations.find(item => item.name === 'Rifle Walk')
    this.walkClip = compatibleClip(walk, this.figure)
    this.rounds = weapon.rounds
    this.posts = posts
    this.chest = this.figure.getObjectByName('mixamorigSpine2')
    this.arms = surrenderArms(this.figure)
  }

  get alive() {
    return this.body.alive
  }

  place(position, groundHeight, index = 0) {
    this.mesh.position.copy(position)
    this.gun.shots = index
    this.gun.wait = .5 + (index * 7 % 10) * .27
    this.gun.update(0, this.mesh, this.posts)
    const soles = ['Left', 'Right'].map(side => {
      const toe = this.figure.getObjectByName('mixamorig' + side + 'ToeBase').getWorldPosition(new THREE.Vector3())
      return groundHeight(toe.x, toe.z) - toe.y + .035
    })
    this.mesh.position.y += Math.max(...soles)
    this.body.x = this.mesh.position.x
    this.body.y = this.mesh.position.y + this.body.size.height / 2
    this.body.z = this.mesh.position.z
    this.body.yaw = this.mesh.rotation.y + Math.PI / 2
    this.groundHeight = groundHeight
  }

  fall() {
    if (!this.alive) return
    this.body.setState('dead')
    this.gun.mixer.stopAllAction()
    this.falling = this.gun.mixer.clipAction(this.deathClip)
    this.falling.setLoop(THREE.LoopOnce, 1)
    this.falling.clampWhenFinished = true
    this.falling.play()
  }

  surrender() {
    this.gun.mixer.stopAllAction()
    this.gun.grip.rifle.removeFromParent()
    this.surrenderWalk = this.gun.mixer.clipAction(this.walkClip).reset().play()
  }

  updateSurrender(dt, moving) {
    this.surrenderWalk.paused = !moving
    this.gun.mixer.update(dt)
    poseSurrender(this.figure, this.mesh, this.arms)
  }

  update(dt) {
    if (this.alive) return this.gun.update(dt, this.mesh, this.posts)
    if (!this.falling) return
    this.gun.mixer.update(dt)
    if (this.falling.paused) {
      const box = new THREE.Box3().setFromObject(this.figure, true)
      this.mesh.position.y += this.groundHeight(this.mesh.position.x, this.mesh.position.z) - box.min.y
      this.falling = null
    }
  }
}

export default function makeInfantryFighter(look, posts, textures) {
  const mesh = loadedModel(look.model)
  const body = makeCharacterBody(mesh, infantryBody.animDict, infantryBody.body)
  return new InfantryFighter(body, mesh, look, posts, textures)
}
