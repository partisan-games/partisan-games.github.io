import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { createPageElements } from './helpers/dom.js'

before(() => createPageElements())

const shaderFiles = readdirSync(new URL('../../core3d/shaders/', import.meta.url)).filter(file => file.endsWith('.js'))

for (const file of shaderFiles)
  test(`the ${file} shader makes a new material with its own uniforms each time`, async() => {
    const { createMaterial } = await import(`/core3d/shaders/${file}`)
    const first = createMaterial(), second = createMaterial()

    assert.notEqual(first, second)
    for (const [name, uniform] of Object.entries(first.uniforms)) {
      assert.notEqual(uniform, second.uniforms[name], `uniform ${name}`)
      if (typeof uniform.value === 'object' && !uniform.value?.isTexture) // a texture is a shared, loaded once resource
        assert.ok(uniform.value === null || uniform.value !== second.uniforms[name].value, `value of ${name}`)
    }
  })

test('the lava ground and a lava avatar each keep their own time', async() => {
  const { createLava } = await import('/core3d/ground.js')
  const { default: Avatar } = await import('/core3d/actor/Avatar.js')
  const { getMesh } = await import('/core3d/helpers.js')
  const ground = await createLava(), nextGround = await createLava()
  const avatar = new Avatar({ skin: 'LAVA' })
  const groundTime = ground.material.uniforms.time.value

  avatar.update(1)
  ground.material.uniforms.time.value += 5

  assert.equal(nextGround.material.uniforms.time.value, groundTime, 'a new lava ground starts from the beginning')
  assert.notEqual(getMesh(avatar.mesh).material, ground.material)
  avatar.end?.()
})
