import * as THREE from 'three'
import { mapRange } from './helpers.js'
import { assets } from '/config.js'

const { randInt } = THREE.MathUtils

let oldIntensity, oldBackground

export function dirLight({
  scene,
  pos = [20, 50, 20],
  color = 0xffffff,
  intensity = Math.PI,
  target,
  mapSize = 512,
  area = 5,
} = {}) {
  const light = new THREE.DirectionalLight(color, intensity)
  light.position.set(...pos)
  light.castShadow = true
  light.shadow.mapSize.width = light.shadow.mapSize.height = mapSize
  if (target) light.target = target
  if (scene) scene.add(light)
  light.shadow.camera.left = light.shadow.camera.bottom = -area
  light.shadow.camera.right = light.shadow.camera.top = area
  return light
}

export function pointLight({ scene, color = 0xffffff, intensity = Math.PI, mapSize = 512, pos = [0, 30, 30] } = {}) {
  const light = new THREE.PointLight(color, intensity)
  light.position.set(...pos)
  light.castShadow = true
  light.shadow.mapSize.width = light.shadow.mapSize.height = mapSize
  if (scene) scene.add(light)
  return light
}

export function hemLight({ scene, skyColor = 0xfffff0, groundColor = 0x101020, intensity = Math.PI } = {}) {
  const light = new THREE.HemisphereLight(skyColor, groundColor, intensity)
  if (scene) scene.add(light)
  return light
}

export function ambLight({ scene, color = 0xffffff, intensity = Math.PI } = {}) { // 0x343434
  const light = new THREE.AmbientLight(color, intensity)
  if (scene) scene.add(light)
  return light
}

export function createSun({ color = 0xffffff, intensity = Math.PI * 1.5, target, pos = [15, 50, 50], mapSize = 1024, r = 1, transparent = false, planetColor = 0xFCE570, addLight = true, file } = {}) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r),
    new THREE.MeshToonMaterial({
      color: planetColor,
      transparent,
      opacity: transparent ? 0 : 1,
      map: file ? new THREE.TextureLoader().load(`${assets.textures}${file}`) : null
    })
  )
  if (addLight) {
    const light = pointLight({ color, intensity, target, mapSize })
    const ambientLight = new THREE.AmbientLight(0xfffee1, intensity * .75)
    mesh.add(light, ambientLight)
  }
  mesh.position.set(...pos)
  return mesh
}

export const createMoon = ({
  pos = [50, 100, 50], color = 0xFFF8DE, planetColor = 0xF6F1D5, r = 4, ...rest
} = {}) => createSun({ pos, color, planetColor, r, ...rest })

/** `scope` is the ResourceScope whose clock the flash and the thunder wait on. */
export function lightningStrike(light, scene, scope) {
  scene.userData.audio?.output.preload('thunder.mp3')
  if (!oldIntensity) oldIntensity = light.intensity
  if (!oldBackground) oldBackground = new THREE.Color(scene.background)

  const distance = randInt(100, 3000)
  light.intensity = mapRange(distance, 3000, 100, 1.2, 2)

  const newColor = new THREE.Color().lerpColors(
    oldBackground, new THREE.Color(0xFFFFFF), light.intensity - 1
  )

  scene.background = newColor

  scope.after(.5, () => {
    light.intensity = oldIntensity
    scene.background = oldBackground
  })

  // sound travels about 333 m in a second
  scope.after(distance * .003, () => {
    // No strike position is modelled here: this is explicitly a nonspatial weather event.
    scene.userData.audio?.emit('thunder.mp3', { profile: 'ambience' })
  })
}

export function orbiting(planet, time, radiusX = 8, axis = 0, radiusZ = radiusX) {
  const x = Math.cos(time) * radiusX
  const z = Math.sin(time) * radiusZ

  switch (axis) {
    case 1:
      planet.position.x = x
      planet.position.y = z
      break
    case 2:
      planet.position.set(x, z, z)
      break
    case 3:
      planet.position.set(x, x, z)
      break
    default:
      planet.position.x = x
      planet.position.z = z
      break
  }
}
