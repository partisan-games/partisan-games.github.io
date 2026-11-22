import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { assets } from '/config.js'
import { loadedModel } from '/core3d/assets/models.js'
import { description as partisan } from '/core3d/actor/derived/ww2/PartisanAim.js'
import { description as machineGunner } from '/core3d/actor/derived/ww2/GermanMachineGunner.js'
import { resistanceFighterModel, riflemanModel, stations } from './Crew.js'
import Rifleman, { rifleModel } from './Rifleman.js'

const rifle = { model: rifleModel, rounds: 1 }
const berthier = { model: partisan.twoHandedWeapon, rounds: 1 }
const mg = { model: machineGunner.twoHandedWeapon, rounds: 3 }
const mp40 = { model: { file: 'weapon/machine-gun/model.fbx', scale: .01 }, rounds: 3 }
const lowpoly = { ...resistanceFighterModel, file: 'partisan-lowpoly.fbx' }
export const infantryModels = [berthier.model, mg.model, mp40.model, lowpoly]

// Material slots in the original soldier FBXs keep fabric, equipment and faces separate.
const shirt = 'mat_15-27374EA0.jpg', trousers = 'mat_9-27375500.jpg', face = 'mat_12-27374460.jpg'
const cap = 'mat_11-27373E00.jpg'
const indigo = 'indigo-work-shirt.jpg', wool = 'brown-wool-shirt.jpg', moustache = 'partisan-moustache.jpg'
function dressFighter(figure, outfit, textures) {
  if (!outfit) return
  function replace(material) {
    const swatch = outfit[material.name]
    if (!swatch) return material
    const dressed = material.clone()
    if (typeof swatch === 'number') dressed.color.setHex(swatch)
    else {
      if (!textures.has(swatch)) {
        const map = new THREE.TextureLoader().load(assets.models + 'character/soldier/' + swatch)
        map.colorSpace = THREE.SRGBColorSpace
        // The FBX uses tiled UVs, including a face entirely in the second vertical tile.
        const original = material.map
        map.wrapS = original.wrapS
        map.wrapT = original.wrapT
        map.offset.copy(original.offset)
        map.repeat.copy(original.repeat)
        map.rotation = original.rotation
        map.center.copy(original.center)
        map.flipY = original.flipY
        textures.set(swatch, map)
      }
      dressed.map = textures.get(swatch)
    }
    return dressed
  }
  figure.traverse(part => {
    if (part.isMesh)
      part.material = Array.isArray(part.material) ? part.material.map(replace) : replace(part.material)
  })
}

function compatibleClip(clip, figure) {
  const tracks = clip.tracks.filter(track => figure.getObjectByName(track.name.split('.')[0]))
  return new THREE.AnimationClip(clip.name, clip.duration, tracks)
}

// Clothing and weapon combinations follow the 2D vojnik, ustanik, spanac and zimski figures.
const regular = stations[0].model
export const variants = {
  strelac: { name: 'Rifleman', model: regular, weapon: rifle },
  smedji: { name: 'Brown uniform · Berthier', model: lowpoly, weapon: berthier, outfit: { 'army.green': 0x665541, avocado: 0x40372f } },
  mitraljezac: { name: 'Machine gunner', model: riflemanModel, weapon: mg },
  vuna: { name: 'Wool shirt · rifle', model: resistanceFighterModel, weapon: rifle, outfit: { [shirt]: wool, [trousers]: 0xc7ac82 } },
  indigo: { name: 'Blue shirt · moustache', model: resistanceFighterModel, weapon: berthier, outfit: { [shirt]: indigo, [face]: moustache } },
  zimski: { name: 'Blue-grey uniform · machine gun', model: lowpoly, weapon: mg, outfit: { 'army.green': 0x687985, avocado: 0x41494a } },
  maslinasti: { name: 'Olive uniform · MP40', model: lowpoly, weapon: mp40, outfit: { 'army.green': 0x4d5037, avocado: 0x777253 } },
  brkovi: { name: 'Grey cap · moustache', model: resistanceFighterModel, weapon: berthier, outfit: { [cap]: 0x8b9096, [trousers]: 0x858a93, [face]: moustache } },
  sivi: { name: 'Grey shirt · MP40', model: resistanceFighterModel, weapon: mp40, outfit: { [shirt]: 0x89929a, [trousers]: 0x90999c } },
  oker: { name: 'Ochre shirt · rifle', model: resistanceFighterModel, weapon: rifle, outfit: { [shirt]: 0xb29a69, [cap]: 0xa18b65, [trousers]: 0xc1af90 } },
}

export const modelsFor = ({ model, weapon }) => [model, weapon.model, riflemanModel, regular]

export default class CannonPartisan {
  constructor({ model, weapon, outfit, stature = 1 }, posts, textures = new Map()) {
    this.mesh = new THREE.Group()
    this.figure = clone(loadedModel(model))
    this.figure.scale.multiplyScalar(stature)
    dressFighter(this.figure, outfit, textures)
    this.mesh.add(this.figure)
    const motionModel = model.sharedClips ? loadedModel(model) : loadedModel(riflemanModel)
    const clips = motionModel.userData.animations
    const action = weapon.rounds > 1 ? 'burst' : 'fire'
    const clip = compatibleClip(clips.find(item => item.name === riflemanModel.animDict[action]), this.figure)
    this.gun = new Rifleman(this.figure, clip, weapon.model)
    const death = clips.find(item => item.name === 'Crouch Death')
      ?? loadedModel(regular).userData.animations.find(item => item.name === regular.animDict.death)
    this.deathClip = compatibleClip(death, this.figure)
    this.rounds = weapon.rounds
    this.posts = posts
    this.chest = this.figure.getObjectByName('mixamorigSpine2')
    this.alive = true
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
    this.groundHeight = groundHeight
  }

  fall() {
    if (!this.alive) return
    this.alive = false
    this.gun.mixer.stopAllAction()
    this.falling = this.gun.mixer.clipAction(this.deathClip)
    this.falling.setLoop(THREE.LoopOnce, 1)
    this.falling.clampWhenFinished = true
    this.falling.play()
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
