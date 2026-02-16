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

  get run() {
    return this.actions.run
  }

  get walk() {
    return this.actions.walk
  }

  getAction(stateName) {
    return this.actions[stateName]
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

  /* ACTION HELPERS */

  playAction(oldAction, name, onFinish) {
    const action = this.getAction(name)
    this.addEventListener('finished', onFinish)
    action.reset()
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true
    if (oldAction) action.crossFadeFrom(oldAction, .25)

    action.play()
  }

  playActionOnce(oldAction, name, shouldReverse = false) {
    const action = this.getAction(name)
    if (!action) return

    action.reset()
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true
    this.transitFrom(oldAction, name, .5)

    if (shouldReverse) this.reverseClip(this.action)
  }

  playLoopAction(oldAction, name, onLoopEnd) {
    const action = this.getAction(name)
    if (!action) return

    action.reset()
    this.transitFrom(oldAction, name, .25)
    this.addEventListener('loop', onLoopEnd)
  }

  findActiveAction(prevAction) {
    if (prevAction) return prevAction

    const othersActive = this.mixer?._actions.filter(action => action.isRunning() && action !== action)
    const first = othersActive.shift()

    if (!first) this.mixer.stopAllAction()
    else othersActive.forEach(action => action.stop())

    return first
  }

  // https://gist.github.com/rtpHarry/2d41811d04825935039dfc075116d0ad
  reverseClip(name, timescale = -1) {
    const action = this.getAction(name)
    if (!action) return

    if (action.time === 0)
      action.time = action.getClip().duration
    action.paused = false
    action.setEffectiveTimeScale(timescale)
  }

  transitFrom(oldName, name, duration = .25) {
    const oldAction = this.findActiveAction(oldName)
    const action = this.getAction(name)
    if (action === oldAction) return

    if (action && oldAction) action.crossFadeFrom(oldAction, duration)
    action?.play()
  }

  resetSpeed(name, scale = 1) {
    const action = this.getAction(name)

    action?.setEffectiveTimeScale(scale)
  }

  /* EVENTS */

  addEventListener(name, callback) {
    this.mixer.addEventListener(name, callback)
  }

  removeEventListener(name, callback) {
    this.mixer.removeEventListener(name, callback)
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