import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createPageElements } from './helpers/dom.js'

let Scena3D

before(async() => {
  createPageElements()
  Scena3D = (await import('/core/Scena3D.js')).default
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

  Scena3D.prototype.disposeScene.call({ scene })

  for (const [name, disposed] of Object.entries(watched)) assert.ok(disposed(), name)
  assert.ok(bonesFreed, 'bones')
})
