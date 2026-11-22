import * as THREE from 'three'
import { infantryWeapons } from './partisanLooks.js'
import { description as soldier } from './Soldier.js'
import shapeM33 from './shapeM33.js'
import soldierFace from './soldierFace.js'

const model = { ...soldier.model, size: 1.74, fitVisible: true, animDict: {} }
const box = new THREE.BoxGeometry(1, 1, 1)
const roll = new THREE.CylinderGeometry(.5, .5, 1, 12)
const hem = new THREE.CylinderGeometry(.44, .55, 1, 12)
const wool = new THREE.MeshLambertMaterial({ color: 0x58604f })
const leather = new THREE.MeshLambertMaterial({ color: 0x594534 })
const canvas = new THREE.MeshLambertMaterial({ color: 0x807b59 })
const collarBlack = new THREE.MeshLambertMaterial({ color: 0x171816 })
const collarRed = new THREE.MeshLambertMaterial({ color: 0x8a2422 })
const collarWhite = new THREE.MeshLambertMaterial({ color: 0xe2dfd0 })
const collarSilver = new THREE.MeshLambertMaterial({ color: 0xd8d7ca })
const starShape = new THREE.Shape()
for (let i = 0; i < 10; i++) {
  const angle = Math.PI / 2 + i * Math.PI / 5
  const radius = i % 2 ? .42 : 1
  const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius
  if (i) starShape.lineTo(x, y)
  else starShape.moveTo(x, y)
}
starShape.closePath()
const star = new THREE.ShapeGeometry(starShape)
// Multipliers for the original skin texture, sampled from the matching portrait's cheeks.
const skinTones = [
  0xfff7f1, 0xf2e7df, 0xf3e6dc, 0xfff5ed, 0xeee0d7,
  0xf7ebe2, 0xf2e5dc, 0xebddd4, 0xfff7f2, 0xf1e3da,
]

// Dimensions are metres in the bone's local axes, independent of the imported FBX scale.
function equipment(boneName, pieces) {
  return figure => {
    const bone = figure.getObjectByName('mixamorig' + boneName)
    const kit = new THREE.Group()
    kit.scale.setScalar(1 / bone.getWorldScale(new THREE.Vector3()).x)
    for (const [geometry, material, size, position, angle = 0] of pieces) {
      const piece = new THREE.Mesh(geometry, material)
      piece.scale.fromArray(size)
      piece.position.fromArray(position)
      piece.rotation.z = angle
      piece.castShadow = true
      kit.add(piece)
    }
    bone.add(kit)
    return kit
  }
}

// Infantry wore the Murge regimental patch; the divisional MG battalion had its own patch.
function murgeCollar(figure, machineGunner) {
  const bone = figure.getObjectByName('mixamorigNeck')
  const marks = new THREE.Group()
  marks.scale.setScalar(1 / bone.getWorldScale(new THREE.Vector3()).x)
  for (const side of [-1, 1]) {
    const tab = new THREE.Group()
    // Sit on top of the jacket collar; the previous 44 mm patch was hidden in the mesh.
    tab.position.set(-.119, -.045, side * .058)
    tab.rotation.y = side * .18

    if (machineGunner) {
      const field = new THREE.Mesh(box, collarRed)
      field.scale.set(.006, .068, .032)
      field.castShadow = true
      tab.add(field)
      for (const y of [.007, .021]) {
        const stripe = new THREE.Mesh(box, collarWhite)
        stripe.scale.set(.0065, .005, .033)
        stripe.position.set(-.0005, y, 0)
        tab.add(stripe)
      }
    } else
      for (const [material, z] of [
        [collarBlack, -.011], [collarRed, 0], [collarBlack, .011],
      ]) {
        const stripe = new THREE.Mesh(box, material)
        stripe.scale.set(.006, .068, .011)
        stripe.position.z = z
        stripe.castShadow = true
        tab.add(stripe)
      }

    const badge = new THREE.Mesh(star, collarSilver)
    badge.scale.setScalar(.0095)
    badge.position.set(-.0065, -.019, 0)
    badge.rotation.y = -Math.PI / 2
    tab.add(badge)
    marks.add(tab)
  }
  bone.add(marks)
  return marks
}

const winterCoat = equipment('Hips', [
  [hem, wool, [.43, .38, .32], [0, -.085, 0]],
  [roll, leather, [.426, .047, .314], [0, .075, 0]],
])
const blanket = equipment('Spine2', [
  [roll, wool, [.16, .46, .16], [0, .065, -.16], Math.PI / 2],
  ...[-.14, .14].map(x => [roll, leather, [.166, .027, .166], [x, .065, -.16], Math.PI / 2]),
])
const satchel = equipment('Hips', [
  [box, canvas, [.11, .23, .23], [-.205, -.055, -.015]],
  [box, leather, [.117, .07, .238], [-.205, .031, -.015]],
])
const pouches = equipment('Hips', [-1, 1].flatMap(side => [0, 1].map(i =>
  [box, leather, [.078, .12, .065], [side * (.065 + i * .083), .04, .13 - i * .024]])))

const uniformMaterials = new Set([
  'mat_2-Chest.jpg', 'mat_5-Pelvis.jpg', 'mat_6-Feet.jpg',
  'mat_7-Arms.jpg', 'mat_9-Arms.jpg', 'mat_11-Legs.jpg',
])

function soilUniform(figure, { amount, seed }) {
  figure.traverse(part => {
    if (!part.isSkinnedMesh || !Array.isArray(part.material)) return
    const { geometry } = part
    const positions = geometry.attributes.position
    let colors = geometry.attributes.color
    if (!colors) {
      colors = new THREE.Float32BufferAttribute(new Float32Array(positions.count * 3).fill(1), 3)
      geometry.setAttribute('color', colors)
    }
    for (const group of geometry.groups) {
      const material = part.material[group.materialIndex]
      if (!uniformMaterials.has(material.name)) continue
      material.vertexColors = true
      material.needsUpdate = true
      for (let i = group.start; i < group.start + group.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i)
        const lower = 1 - THREE.MathUtils.smoothstep(y, -.55, .25)
        const speckle = .5 + .5 * Math.sin(x * 93 + y * 57 + z * 71 + seed * 13)
        const patch = .5 + .5 * Math.sin(x * 19 - y * 23 + z * 29 + seed * 7)
        const mud = amount * THREE.MathUtils.clamp(.08 + lower * .62 + speckle * patch * .3, 0, 1)
        colors.setXYZ(i, colors.getX(i) * (1 - mud * .38), colors.getY(i) * (1 - mud * .47),
          colors.getZ(i) * (1 - mud * .58))
      }
    }
  })
}

function look(name, weapon, jacket, trousers, helmet, equip, face, wear, machineGunner = false) {
  const outfit = {
    'mat_2-Chest.jpg': jacket, 'mat_7-Arms.jpg': jacket, 'mat_9-Arms.jpg': jacket,
    'mat_5-Pelvis.jpg': trousers, 'mat_11-Legs.jpg': trousers, 'mat_6-Feet.jpg': 0x655747,
    'mat_4-Helmet.jpg': helmet, 'mat_8-Helmet.jpg': helmet,
    'mat_0-Hands.jpg': skinTones[face.portrait],
    'mat_10-Face.jpg': 0xffffff, 'mat_12-Eyes.jpg': 0xffffff,
  }
  return { name, model, weapon, outfit, equip(figure) {
    shapeM33(figure)
    soldierFace(figure, face)
    if (wear) soilUniform(figure, wear)
    const kit = equip(figure), collar = murgeCollar(figure, machineGunner)
    return { removeFromParent() {
      kit.removeFromParent(); collar.removeFromParent()
    } }
  } }
}

const { rifle, berthier, mp40, mg } = infantryWeapons
export const italianLooks = {
  rifle: look('Italian rifleman · field pouches', rifle, 0x8b9383, 0x808778, 0x626b56, pouches, { portrait: 0, jaw: .23, nose: -.007, chin: -.004 }),
  rifleCoat: look('Italian rifleman · winter coat', rifle, 0x768071, 0x717969, 0x899080, winterCoat, { portrait: 1, jaw: -.18, nose: .016, chin: .009 }, { amount: .28, seed: 1 }),
  berthier: look('Italian Berthier rifleman · haversack', berthier, 0x87907e, 0x757d70, 0x717a66, satchel, { portrait: 2, jaw: .1, nose: .014, chin: .004 }),
  berthierRoll: look('Italian Berthier rifleman · blanket roll', berthier, 0x959a8c, 0x71796c, 0x505a53, blanket, { portrait: 3, jaw: -.22, nose: -.008, chin: .012 }, { amount: .18, seed: 3 }),
  mp40: look('Italian submachine gunner · winter coat', mp40, 0x788171, 0x858b7e, 0x6b745f, winterCoat, { portrait: 4, jaw: .25, nose: .008, chin: .008 }),
  mp40Bag: look('Italian submachine gunner · haversack', mp40, 0x919887, 0x777f72, 0x808775, satchel, { portrait: 5, jaw: -.12, nose: .01, chin: -.007 }, { amount: .34, seed: 5 }),
  mg: look('Italian machine gunner · field pouches', mg, 0x828b79, 0x808779, 0x535e4e, pouches, { portrait: 6, jaw: .26, nose: .018, chin: -.005 }, undefined, true),
  mgRoll: look('Italian machine gunner · blanket roll', mg, 0x949a8c, 0x70796c, 0x737c69, blanket, { portrait: 7, jaw: -.17, nose: .006, chin: .014 }, undefined, true),
  mgCoat: look('Italian machine gunner · winter coat', mg, 0x6e786a, 0x798273, 0x677368, winterCoat, { portrait: 8, jaw: .13, nose: -.012, chin: -.009 }, { amount: .24, seed: 8 }, true),
  mgBag: look('Italian machine gunner · haversack', mg, 0x8d9485, 0x798174, 0x909684, satchel, { portrait: 9, jaw: -.06, nose: .017, chin: .007 }, { amount: .14, seed: 9 }, true),
}
