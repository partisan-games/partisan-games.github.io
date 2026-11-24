import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { loadModel } from '/core3d/loaders.js'
import { skyGradients } from '/core/constants.js'
import stageColors from '/catalog/stageColors.js'

/**
 * Shows the model a card chooses, one at a time, on the catalog's ground under its light sky; the mouse turns and
 * zooms the view. A model loads only when chosen, so a folder of many models opens at once.
 */
const view = document.querySelector('.model-view')
const canvas = view.querySelector('canvas')
const status = view.querySelector('.model-status')
canvas.style.background = skyGradients.svetla

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
renderer.shadowMap.enabled = true
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(45, 1, .01, 1000)
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

scene.add(new THREE.HemisphereLight(0xffffff, 0x444433, 2))
const sun = new THREE.DirectionalLight(0xffffff, 2.5)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
scene.add(sun, sun.target)
const ground = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2),
  new THREE.MeshLambertMaterial({ color: stageColors.ground }))
ground.receiveShadow = true
scene.add(ground)

/** Clips of the model, playing its first one in a loop. */
let mixer = null
let shown = null
let request = 0
const clock = new THREE.Clock()

function resize() {
  const { clientWidth: width, clientHeight: height } = canvas
  if (canvas.width === Math.round(width * renderer.getPixelRatio())) return
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

/** Puts the model on the ground at the middle and frames it, its ground and shadow as large as it is. */
function place(mesh) {
  const box = new THREE.Box3().setFromObject(mesh, true)
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3())
  mesh.position.sub(new THREE.Vector3(center.x, box.min.y, center.z))
  const reach = Math.max(size.x, size.y, size.z)
  ground.scale.setScalar(reach * 3)
  sun.position.set(reach, reach * 2, reach * 1.2)
  Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, far: reach * 6 })
  sun.shadow.camera.updateProjectionMatrix()
  controls.target.set(0, size.y / 2, 0)
  camera.position.set(reach * 1.4, size.y / 2 + reach * .6, reach * 1.6)
  camera.near = reach / 100
  camera.far = reach * 50
  camera.updateProjectionMatrix()
  controls.update()
}

function dispose(mesh) {
  mesh.traverse(part => {
    part.geometry?.dispose()
    for (const material of [].concat(part.material ?? [])) {
      for (const value of Object.values(material)) if (value?.isTexture) value.dispose()
      material.dispose()
    }
  })
}

async function show(button) {
  const current = ++request
  const name = button.dataset.model.split('/').pop()
  status.textContent = `Učitava se ${name}…`
  view.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  try {
    const mesh = await loadModel({ file: button.dataset.model, mtl: button.dataset.mtl, size: 2 })
    if (current !== request) return dispose(mesh)
    if (shown) {
      scene.remove(shown)
      dispose(shown)
    }
    shown = mesh
    mesh.traverse(part => {
      if (part.isMesh) part.castShadow = part.receiveShadow = true
    })
    scene.add(mesh)
    place(mesh)
    mixer = null
    const [clip] = mesh.userData.animations ?? []
    if (clip) {
      mixer = new THREE.AnimationMixer(mesh)
      mixer.clipAction(clip).play()
    }
    status.textContent = name + (clip ? ` · animacija ${clip.name}` : '')
  } catch (error) {
    if (current === request) status.textContent = `${name} se ne može učitati: ${error.message}`
  }
}

const cards = [...document.querySelectorAll('[data-model]')]
const fileName = button => button.dataset.model.split('/').pop()

/** The model the address names, as a link in the tree gives it, or the folder's only one: shown without a click. */
function showChosen() {
  const name = decodeURIComponent(location.hash.slice(1))
  const button = cards.find(card => fileName(card) === name) ?? (cards.length === 1 ? cards[0] : null)
  if (button) show(button)
}

document.querySelector('.gallery').addEventListener('click', event => {
  const button = event.target.closest('[data-model]')
  if (!button) return
  // the address keeps the choice, so a reload or a shared link shows the same model
  if (location.hash === '#' + encodeURIComponent(fileName(button))) show(button)
  else location.hash = encodeURIComponent(fileName(button))
})
window.addEventListener('hashchange', showChosen)
showChosen()

renderer.setAnimationLoop(() => {
  resize()
  const dt = clock.getDelta()
  mixer?.update(dt)
  controls.update()
  renderer.render(scene, camera)
})
