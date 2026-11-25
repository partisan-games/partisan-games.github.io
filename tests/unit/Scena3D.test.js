import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createPageElements } from './helpers/dom.js'

let Scene3D

before(async() => {
  createPageElements()
  Scene3D = (await import('/core/Scene3D.js')).default
})

/** Returns a function that tells whether the resource has been disposed. */
const watchDispose = resource => {
  let disposed = false
  resource.addEventListener('dispose', () => {
    disposed = true
  })
  return () => disposed
}

test('a 3D game frees its geometries, materials, textures, bones and shadow maps when it ends', () => {
  const scene = new THREE.Scene()
  const map = new THREE.Texture()
  const lava = new THREE.Texture()
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ map }))
  const shader = new THREE.ShaderMaterial({ uniforms: { lava: { value: lava } } })
  const bone = new THREE.Bone()
  const skinned = new THREE.SkinnedMesh(new THREE.BoxGeometry(), [shader])
  skinned.add(bone)
  skinned.bind(new THREE.Skeleton([bone]))
  const light = new THREE.DirectionalLight()
  light.shadow.map = new THREE.WebGLRenderTarget(1, 1)
  scene.add(mesh, skinned, light)
  const watched = {
    geometry: watchDispose(mesh.geometry), material: watchDispose(mesh.material), map: watchDispose(map),
    shader: watchDispose(shader), uniformTexture: watchDispose(lava), shadowMap: watchDispose(light.shadow.map),
  }
  let bonesFreed = false
  skinned.skeleton.dispose = () => {
    bonesFreed = true
  }

  Scene3D.prototype.disposeScene.call({ scene })

  for (const [name, disposed] of Object.entries(watched)) assert.ok(disposed(), name)
  assert.ok(bonesFreed, 'bones')
})

test('a texture the shared renderer uploads again after its game ended is freed when the next 3D game ends', () => {
  const wall = new THREE.Texture()
  const scene = new THREE.Scene()
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshLambertMaterial({ map: wall })))
  Scene3D.prototype.disposeScene.call({ scene })
  const freedAgain = watchDispose(wall)

  wall.onUpdate(wall) // the renderer uploads the freed texture during the next game
  Scene3D.prototype.disposeScene.call({ scene: new THREE.Scene() })

  assert.ok(freedAgain())
})

test('a game that ends frees the shared portrait atlas its Italian soldiers draw their faces from', async t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  const { default: soldierFace } = await import('/core3d/actor/derived/ww2/soldierFace.js')
  const materials = Array.from({ length: 6 }, () => new THREE.MeshStandardMaterial())
  materials[0].name = 'mat_10-Face.jpg'
  const figure = new THREE.SkinnedMesh(new THREE.BoxGeometry(), materials)
  const bone = new THREE.Bone()
  figure.add(bone)
  figure.bind(new THREE.Skeleton([bone]))
  const scene = new THREE.Scene()
  scene.add(figure)
  soldierFace(figure, { portrait: 0, jaw: 0, nose: 0, chin: 0 })
  const shader = { uniforms: {}, vertexShader: '#include <begin_vertex>', fragmentShader: '#include <map_fragment>' }
  materials[0].onBeforeCompile(shader)
  const atlas = shader.uniforms.faceAtlas.value
  const freed = watchDispose(atlas)

  Scene3D.prototype.disposeScene.call({ scene })

  assert.ok(freed())
})
