import * as THREE from 'three'
import { getMesh } from '/core3d/helpers.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

const walkingStates = ['wander', 'follow', 'patrol']
const runningStates = ['pursue', 'flee']

export default class Animator {
  constructor({ mesh, animations, animDict, twoHandedWeapon, rightHandWeapon, isAi }) {
    this.mesh = mesh
    this.actions = {}
    this.rightHand = null
    this.leftHand = null

    this.setupMixer(animations, animDict)
    if (isAi) this.setupAIActions()

    if (twoHandedWeapon) this.addTwoHandedWeapon(clone(twoHandedWeapon))
    if (rightHandWeapon) this.addRightHandWeapon(clone(rightHandWeapon))
  }

  setupMixer(animations, animDict) {
    this.mixer = new THREE.AnimationMixer(getMesh(this.mesh))
    for (const state in animDict) {
      const clip = animations.find(anim => anim.name === animDict[state])
      this.addAction(state, clip)
    }
    if (!animDict.run && animDict.walk)
      this.setDefaultRun()
  }

  setupAIActions() {
    const { actions } = this
    walkingStates.forEach(name => {
      if (!actions[name]) actions[name] = actions.walk
    })
    runningStates.forEach(name => {
      if (!actions[name]) actions[name] = actions.run
    })
  }

  addAction(state, clip) {
    this.actions[state] = this.mixer.clipAction(clip)
  }

  setDefaultRun() {
    const clip = this.actions.walk._clip
    this.actions.run = this.mixer.clipAction(clip.clone()).setEffectiveTimeScale(1.5)
  }

  findHands() {
    this.mesh.traverse(child => {
      if (child.name === 'mixamorigRightHand') this.rightHand = child
      if (child.name === 'mixamorigLeftHandMiddle1') this.leftHand = child
    })
  }

  addTwoHandedWeapon(mesh) {
    if (!this.rightHand || !this.leftHand) this.findHands()
    this.rightHand.add(mesh)
    this.twoHandedWeapon = mesh
  }

  addRightHandWeapon(mesh) {
    if (!this.rightHand) this.findHands()
    this.rightHand.add(mesh)
  }

  /* UPDATES */

  updateRifle() {
    const pos = new THREE.Vector3()
    this.leftHand.getWorldPosition(pos)
    this.twoHandedWeapon.lookAt(pos)
  }

  update(delta) {
    if (this.twoHandedWeapon) this.updateRifle()
    this.mixer?.update(delta)
  }
}