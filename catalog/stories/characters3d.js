import { NearestFilter, NearestMipmapLinearFilter } from 'three'
import Stage3D from '../Stage3D.js'
import TwoHandedGrip from '/core3d/actor/characters/TwoHandedGrip.js'
import dressFighter, { outfitTexture } from '/core3d/actor/characters/dressFighter.js'
import { variants, infantryWeapons } from '/core3d/actor/derived/ww2/partisanLooks.js'
import * as italianLooksModule from '/core3d/actor/derived/ww2/italianLooks.js'
import { poseSurrender, surrenderArms } from '/core3d/actor/characters/surrenderPose.js'
import { loadedModel, requestModels } from '/core3d/assets/models.js'
import optimizeGeometry from '/core3d/assets/optimizeGeometry.js'
import makeCharacter, { makeCharacterBody } from '/core3d/actor/characters/makeCharacter.js'
import CharacterModel from '/core3d/actor/characters/CharacterModel.js'
import * as workerPipeModule from '/core3d/actor/derived/ww2/WorkerPipe.js'
import * as chetnikModule from '/core3d/actor/derived/ww2/Chetnik.js'
import * as subaraModule from '/core3d/actor/derived/ww2/ChetnikSubara.js'
import * as germanFlameThrowerModule from '/core3d/actor/derived/ww2/GermanFlameThrower.js'
import * as germanMachineGunnerModule from '/core3d/actor/derived/ww2/GermanMachineGunner.js'
import * as germanSoldierModule from '/core3d/actor/derived/ww2/GermanSoldier.js'
import * as naziAgentModule from '/core3d/actor/derived/ww2/NaziAgent.js'
import * as naziOfficerModule from '/core3d/actor/derived/ww2/NaziOfficer.js'
import * as partisanModule from '/core3d/actor/derived/ww2/Partisan.js'
import * as sutjeskaModule from '/core3d/actor/derived/ww2/sutjeskaLook.js'
import * as partisanLowpolyModule from '/core3d/actor/derived/ww2/PartisanLowpoly.js'
import shapeSavoBlouse from '/core3d/actor/derived/ww2/savoBlouse.js'
import * as resistanceFighterModule from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import * as sSSoldierModule from '/core3d/actor/derived/ww2/SSSoldier.js'
import * as soldierModule from '/core3d/actor/derived/ww2/Soldier.js'
import * as sovietPartisanModule from '/core3d/actor/derived/ww2/SovietPartisan.js'
import * as nikoletinaModule from '/core3d/actor/derived/ww2/nikoletinaLook.js'
import * as workerModule from '/core3d/actor/derived/ww2/Worker.js'
import * as prisonerModule from '/core3d/actor/derived/ww2/Prisoner.js'
import Prisoner from '/core/gameplay/bodies/characters/Prisoner.js'
import Posture from '/core/gameplay/bodies/characters/Posture.js'
import * as tankModule from '/core3d/actor/derived/Tank.js'
import * as hotchkissModule from '/core3d/actor/derived/Hotchkiss.js'

/** A character no game uses yet stays in the shared library, ready for one. */
const library = 'Zajednička biblioteka'
const { italianLooks } = italianLooksModule
const { mountMetalPipe, pipeSwingModel, smoothPipeSwing } = workerPipeModule
const sutjeskaLook = { id: 'sutjeska', name: 'Sutjeska', value: { dress: sutjeskaModule.default }, block: sutjeskaModule }
const sutjeskaPixelMaps = {
  '_1___Default': 'sutjeska-pixel-art/uniform.webp',
  Tex_0534_0_dds: 'sutjeska-pixel-art/face.webp',
  Tex_0532_0_dds: 'sutjeska-pixel-art/eyes.webp',
}
const pixelOutfitLook = (maps, { useMapColors = false, shape } = {}) => ({ id: 'pixel-art', name: 'Pixel art', value: { dress(mesh, textures) {
  shape?.(mesh)
  dressFighter(mesh, maps, textures)
  if (useMapColors) mesh.traverse(part => {
    if (!part.isMesh) return
    for (const material of [].concat(part.material))
      if (Object.hasOwn(maps, material.name)) material.color.setHex(0xffffff)
  })
  for (const file of Object.values(maps)) {
    const map = textures.get(file)
    if (!map) continue
    map.magFilter = NearestFilter
    map.minFilter = NearestMipmapLinearFilter
  }
} } })
const sutjeskaPixelLook = pixelOutfitLook(sutjeskaPixelMaps)
const kocaPortraitLook = {
  ...pixelOutfitLook({
    ...sutjeskaPixelMaps,
    Tex_0534_0_dds: 'sutjeska-pixel-art/face-koca-1943.webp',
    Tex_0532_0_dds: 'sutjeska-pixel-art/eyes-koca-1943.webp',
  }),
  id: 'portret-1943',
  name: 'Portret 1943',
}
const savoPixelMaps = {
  'army.green': 'savo-pixel-art/uniform.webp',
  skin: 'savo-pixel-art/face.webp',
  brown: 'savo-pixel-art/hair-and-leather.webp',
  'navy.blue': 'savo-pixel-art/trousers.webp',
}
const savoPixelLook = pixelOutfitLook(savoPixelMaps, { useMapColors: true, shape: shapeSavoBlouse })
const brownSavoPixel = pixelOutfitLook({
  ...savoPixelMaps, 'army.green': 'savo-pixel-art/uniform-brown.webp',
}, { useMapColors: true, shape: shapeSavoBlouse })
const brownSavoLook = {
  id: 'smedji-pixel-art', name: 'Braon · Berthier · Pixel art',
  value: { ...variants.smedji, ...brownSavoPixel.value, outfit: { avocado: variants.smedji.outfit.avocado } },
}
const crniPixelLook = pixelOutfitLook({
  'mat_11-27373E00.jpg': 'crni-pixel-art/cap.webp',
  'mat_12-27374460.jpg': 'crni-pixel-art/face.webp',
  'mat_14-color_0.467440-0.467440-0.467440.jpg': 'crni-pixel-art/nape.webp',
  'mat_15-27374EA0.jpg': 'crni-pixel-art/shirt.webp',
  'mat_9-27375500.jpg': 'crni-pixel-art/trousers.webp',
})
const brkaPixelLook = pixelOutfitLook({
  'mat_11-27373E00.jpg': 'brka-pixel-art/cap.webp',
  'mat_12-27374460.jpg': 'brka-pixel-art/face.webp',
  'mat_14-color_0.467440-0.467440-0.467440.jpg': 'crni-pixel-art/nape.webp',
  'mat_15-27374EA0.jpg': 'brka-pixel-art/shirt.webp',
  'mat_9-27375500.jpg': 'brka-pixel-art/trousers.webp',
})
const nikoletinaLook = { id: 'jugoslovenska', name: 'Jugosloven', value: { dress: sovietPartisanModule.description.dress },
  block: nikoletinaModule }
const nikoletinaPixelLook = { id: 'pixel-art', name: 'Pixel art', value: { dress: nikoletinaModule.dressNikoletinaPixelArt } }

/**
 * A story of a 3D character, with its model and weapon as its games have them. A 3D block needs its models loaded
 * before it is made. A character with a description is its body and model, with no controller, so a state it is set
 * to lasts until another is set; one without is still the earlier actor that the player leads.
 */
const character = (id, name, game, block, Character) => ({
  id, name, game, block, stage: Stage3D,
  create: async stage => {
    await requestModels(block.models, { parallelAnimations: true })
    if (block.description) {
      const { body, model } = makeCharacter(block.description)
      stage.add(body, model)
      return body
    }
    const actor = new Character({ controller: null })
    stage.add(actor)
    return actor
  },
})

const plainWorker = character('radnik-3d', 'Radnik', library, workerModule)
const worker = {
  ...plainWorker,
  lookLabel: 'Oprema',
  looks: [
    { id: 'original', name: 'Goloruk', value: 'unarmed' },
    { id: 'cev', name: 'Cev', value: 'pipe', block: workerPipeModule, aliases: ['radnik-cev-3d'] },
  ],
  async create(stage, way, equipment) {
    if (equipment === 'unarmed') return plainWorker.create(stage, way)

    await requestModels([pipeSwingModel], { parallelAnimations: true })
    const mesh = loadedModel(pipeSwingModel)
    const { animDict } = pipeSwingModel
    const swing = smoothPipeSwing(mesh.userData.animations)
    const animations = mesh.userData.animations.map(clip => clip.name === swing.name ? swing : clip)
    const body = makeCharacterBody(mesh, animDict, {}, { actions: { attack: swing.duration } })
    const view = new CharacterModel(body, { mesh, animations, animDict })
    mountMetalPipe(view.mesh, { tipLength: .32 })
    stage.add(body, view)
    return body
  },
}

function infantryStory(id, name, game, block, portraitNames = {}) {
  const base = character(id, name, game + ', Battle for Jablanica', block)
  const source = block.description.model
  const choices = [
    ...Object.entries(variants).map(([id, value]) => ({ id, value, army: 'partisan' })),
    ...Object.entries(italianLooks).map(([id, value]) => ({ id, value, army: 'italian' })),
  ]
  const looks = choices
    .filter(({ value }) => value.model.file === source.file && value.model.prefix === source.prefix)
    .map(({ id, value, army }) => {
      if (army === 'italian') return { id: 'italian-' + id, name: value.name, value,
        aliases: ['italijanski-branilac-3d/' + id, ...(id === 'rifle' ? ['italijanski-branilac-3d'] : [])] }
      const oldStory = 'jablanica-' + ({ oker: 'vuna', brkovi: 'indigo' }[id] ?? id)
      const aliases = ['partizan-3d/' + id, 'saborci-jablanica/' + id, oldStory + '/' + id]
      if (oldStory === 'jablanica-' + id) aliases.push(oldStory)
      if (id === 'strelac') aliases.push('saborci-jablanica')
      return { id, name: value.name, value, aliases }
    })
  const story = {
    ...base, lookLabel: 'Varijacije',
    create: async(stage, way, look) => {
      await requestModels([...block.models, ...looks.map(({ value }) => value.weapon.model)], { parallelAnimations: true })
      const { body, model } = makeCharacter({ ...block.description, dress: undefined })
      stage.add(body, model)
      const infantry = enableInfantryLooks(stage, model)
      const arms = surrenderArms(model.mesh)
      let surrendered = false
      const act = body.act.bind(body)
      Object.defineProperty(body, 'acts', { value: [...body.acts, 'surrender'] })
      body.act = action => {
        if (action !== 'surrender') return surrendered ? undefined : act(action)
        surrendered = true
        infantry.unarm()
      }
      const { setLook } = stage
      stage.setLook = next => {
        setLook(next)
        if (surrendered) infantry.unarm()
      }
      stage.add({ update: () => surrendered && poseSurrender(model.mesh, model.mesh, arms) })
      stage.setLook(look)
      return body
    },
  }
  const baseLook = block === sovietPartisanModule ? nikoletinaLook
    : { id: 'original', name: block === partisanLowpolyModule ? 'Osnovna' : 'Maskirna' }
  const original = { ...story, looks: [baseLook],
    catalogGroup: ['Vojnici', id === 'vojnik-3d' ? 'Ostali' : 'Partizani'] }
  const identities = new Map()
  // Old links use the first equipment variant of each combat role as the story ID.
  const oldRoleIds = new Map()
  for (const look of looks) {
    const italian = look.id.startsWith('italian-')
    const { portrait, weapon } = look.value
    const army = italian ? 'Italijani' : 'Partizani'
    const oldRole = `${army}/${weapon === infantryWeapons.mg ? 'mg' : weapon === infantryWeapons.mp40 ? 'mp40' : 'rifle'}`
    if (!oldRoleIds.has(oldRole)) {
      const oldId = `${id}-${look.id}`
      oldRoleIds.set(oldRole, oldId)
      look.aliases.push(oldId)
    }
    look.aliases.push(`${id}/${look.id}`, `${oldRoleIds.get(oldRole)}/${look.id}`)

    if (portrait === undefined) {
      original.looks.push(look)
      continue
    }
    const identity = `${army}/${portrait}`
    if (!identities.has(identity)) identities.set(identity, {
      ...story, id: `${id}-${italian ? `italian-vojnik-${portrait + 1}` : 's-brkovima'}`,
      name: italian ? `Italijanski vojnik ${portrait + 1}` : portraitNames[portrait],
      catalogGroup: ['Vojnici', army], looks: [],
    })
    identities.get(identity).looks.push(look)
  }
  original.looks.sort((a, b) => Number(b.id === 'strelac') - Number(a.id === 'strelac'))
  if (block === partisanModule) original.looks.unshift(sutjeskaPixelLook, kocaPortraitLook, sutjeskaLook)
  if (block === partisanLowpolyModule) {
    original.looks.unshift(savoPixelLook)
    original.looks.splice(original.looks.findIndex(look => look.id === 'smedji') + 1, 0, brownSavoLook)
  }
  if (block === sovietPartisanModule) original.looks.unshift(nikoletinaPixelLook)
  return [original, ...identities.values()]
}

function enableInfantryLooks(stage, { mesh, anim }) {
  const originalWeapon = anim.twoHandedWeapon
  originalWeapon.removeFromParent()
  const parts = []
  mesh.traverse(part => {
    if (part.isMesh) parts.push({ part, material: part.material, geometry: part.geometry })
  })
  const textures = new Map()
  const originals = new Set(parts.flatMap(({ material }) => material))
  let grip, equipment
  stage.setLook = look => {
    originalWeapon.removeFromParent()
    grip?.rifle.removeFromParent()
    equipment?.removeFromParent()
    grip = null
    for (const { part, material, geometry } of parts) {
      for (const current of [].concat(part.material))
        if (!originals.has(current)) current.dispose()
      if (part.geometry !== geometry) part.geometry.dispose()
      part.material = material
      part.geometry = geometry
    }
    look?.dress?.(mesh, textures)
    if (look?.weapon) {
      dressFighter(mesh, look.outfit, textures, look.hatColor)
      if (look === variants.strelac) sutjeskaModule.enlargePartisanCapBadge(mesh)
      equipment = look.equip?.(mesh)
      anim.twoHandedWeapon = null
      grip = new TwoHandedGrip(mesh, look.weapon.model)
    } else anim.addTwoHandedWeapon(originalWeapon)
    optimizeGeometry(mesh)
  }
  stage.add({ update: () => {
    if (grip?.rifle.parent) grip.fitHands()
  } })
  stage.session.scope.add(() => textures.forEach(texture => texture.dispose()))
  return {
    unarm() {
      anim.twoHandedWeapon?.removeFromParent()
      grip?.rifle.removeFromParent()
      anim.twoHandedWeapon = null
    },
  }
}

const machineGunner = character('nemacki-mitraljezac-3d', 'Nemački vojnik s teškom opremom', '3D Tank, FPS Airport, FPS Base', germanMachineGunnerModule)
const heavyPixelMaps = Object.fromEntries([
  ['3359EFA0', 'face', [6]],
  ['3754B440', 'trousers', [3, 10, 18]],
  ['278A34A0', 'eyes', [15]],
  ['3359AD00', 'canvas-bag', [2]],
  ['37547580', 'tunic', [4, 17, 22]],
  ['278A3DA0', 'helmet', [5, 11, 13]],
].flatMap(([source, map, slots]) => slots.map(slot =>
  [`mat_${slot}-${source}.jpg`, `german-heavy-pixel-art/${map}.webp`])))
const pixelMachineGunner = maps => ({
  async create(stage) {
    await requestModels(germanMachineGunnerModule.models, { parallelAnimations: true })
    const { body, model } = makeCharacter(germanMachineGunnerModule.description)
    const textures = new Map()
    pixelOutfitLook(maps).value.dress(model.mesh, textures)
    const materials = new Set()
    model.mesh.traverse(part => {
      if (!part.isSkinnedMesh) return
      for (const material of [].concat(part.material))
        if (Object.hasOwn(maps, material.name)) materials.add(material)
    })
    stage.session.scope.add(() => {
      textures.forEach(texture => texture.dispose())
      materials.forEach(material => material.dispose())
    })
    stage.add(body, model)
    return body
  },
})
const germanRifleman = {
  ...character('nemacki-vojnik-3d', 'Nemački vojnik', 'Drvar, Kraljevo, Aerodrom, Crveni krst', germanSoldierModule),
  catalogGroup: ['Vojnici', 'Nemci'],
  looks: [
    { id: 'original', name: 'Osnovna' },
    { id: 'pixel-art', name: 'Pixel art', value: true },
  ],
  async create(stage, way, pixelArt) {
    await requestModels(germanSoldierModule.models, { parallelAnimations: true })
    const { body, model } = makeCharacter(germanSoldierModule.description)
    const skin = model.mesh.getObjectByProperty('isSkinnedMesh', true)
    const original = skin.material
    let pixel
    stage.setLook = enabled => {
      if (enabled && !pixel) {
        pixel = original.clone()
        pixel.map = outfitTexture('german-soldier-pixel-art/uniform.webp', original.map, new Map())
        pixel.map.magFilter = NearestFilter
        pixel.map.minFilter = NearestMipmapLinearFilter
        stage.session.scope.add(() => {
          pixel.map.dispose()
          pixel.dispose()
        })
      }
      skin.material = enabled ? pixel : original
    }
    stage.setLook(pixelArt)
    stage.add(body, model)
    return body
  },
}
const flameThrower = character('nemacki-bacac-plamena-3d', 'Bacač plamena', 'FPS Base', germanFlameThrowerModule)
const germanHeavyInfantry = {
  ...machineGunner, lookLabel: 'Oprema', catalogGroup: ['Vojnici', 'Nemci'],
  looks: [
    { id: 'pixel-art-drugo-lice', name: 'Mitraljez · Pixel art · Drugo lice', value: pixelMachineGunner({
      ...heavyPixelMaps,
      'mat_6-3359EFA0.jpg': 'german-heavy-pixel-art/face-new-identity.webp',
      'mat_15-278A34A0.jpg': 'german-heavy-pixel-art/eyes-new-identity.webp',
    }) },
    { id: 'mitraljez', name: 'Mitraljez', value: machineGunner },
    { id: 'pixel-art', name: 'Mitraljez · Pixel art', value: pixelMachineGunner(heavyPixelMaps) },
    { id: 'bacac-plamena', name: flameThrower.name, value: flameThrower, block: flameThrower.block, aliases: [flameThrower.id] },
  ],
  create(stage, way, equipment) {
    return equipment.create(stage, way)
  },
}

const [resistanceFighter, ...resistanceIdentities] = infantryStory(
  'borac-pokreta-otpora-3d', 'Drug Crni', 'Liberated City', resistanceFighterModule,
  { moustache: 'Brka' },
)
const brka = resistanceIdentities.find(({ id }) => id.endsWith('-s-brkovima'))
brka.looks.push({ ...brkaPixelLook, value: { ...brkaPixelLook.value, weapon: variants.brkovi.weapon } })
const workerFighter = {
  ...worker, name: resistanceFighter.name, game: resistanceFighter.game,
  catalogGroup: resistanceFighter.catalogGroup, lookLabel: 'Varijacije',
  looks: [
    { id: 'puska', name: 'Puška', block: resistanceFighter.block, aliases: [resistanceFighter.id, `${resistanceFighter.id}/original`] },
    ...worker.looks,
    ...resistanceFighter.looks.slice(1),
    { ...crniPixelLook, block: resistanceFighter.block },
  ],
  async create(stage, way, equipment) {
    if (equipment === 'unarmed' || equipment === 'pipe') return worker.create(stage, way, equipment)
    const body = await resistanceFighter.create(stage, way, equipment)
    // Unarmed, pipe and rifle use different animation sets, so switching rebuilds the preview.
    delete stage.setLook
    return body
  },
}

/** The crouched poses the buttons put a prisoner in. */
const crouchedPoses = { crouch: 'crouchIdle', rest: 'crouchRest', peek: 'crouchPeek' }

/**
 * The men who break out of the camp, a story each: as in their level, each crouches down and gets up through his
 * recorded movement, rests or peers round a corner in a crouch, swings his pipe only once he stands, and wounded
 * stands bent over his wound.
 */
const prisoners = prisonerModule.prisonerLooks.map(({ name, height }, index) => ({
  id: `logoras-${name.toLowerCase()}`, name: `Logoraš ${name}`, game: 'Escape Concentration Camp', block: prisonerModule,
  stage: Stage3D,
  create: async stage => {
    await requestModels(prisonerModule.models, { parallelAnimations: true })
    const body = new Prisoner({ size: { height, length: .4, width: .4 } })
    const model = new prisonerModule.default(body, { index, textures: new Map() })
    const posture = new Posture(body, { durations: model.postureDurations,
      shift: (clip, time) => model.postureShift(clip, time) })
    const attack = body.act.bind(body)
    let swing = false
    Object.defineProperty(body, 'acts', { value: [...Object.keys(crouchedPoses), 'wounded', ...body.acts] })
    body.act = act => {
      if (act === 'attack') {
        body.crouched = false
        swing = true
        return
      }
      if (act === 'wounded') {
        body.crouched = false
        if (model.wounded) body.health.reset()
        else body.health.damage(body.health.current - body.health.maximum / 3)
        return
      }
      body.crouched = act !== 'crouch' || !body.crouched
      body.waitPose = crouchedPoses[act]
    }
    stage.controllers.push({ update: dt => {
      posture.update(dt)
      if (!swing || body.posture || posture.crouched) return
      swing = false
      attack('attack')
    } })
    stage.add(body, model)
    return body
  },
}))

const chetnikPixelMaps = {
  skin: 'cetnik-strelac-pixel-art/face.webp',
  brown: 'cetnik-strelac-pixel-art/hair-beard.webp',
  'brown.uniform': 'cetnik-strelac-pixel-art/blouse.webp',
  'khaki.trousers': 'cetnik-strelac-pixel-art/trousers.webp',
  lips: 'cetnik-strelac-pixel-art/lips.webp',
}
const chetnikPixelLook = pixelOutfitLook(chetnikPixelMaps, { useMapColors: true })
const chetnikRifleman = {
  ...character('cetnik-strelac-3d', 'Četnik strelac', 'Siege of Kraljevo', chetnikModule),
  catalogGroup: ['Vojnici', 'Četnici'],
  looks: [{ id: 'original', name: 'Osnovna' }, chetnikPixelLook],
  async create(stage, way, look) {
    await requestModels(chetnikModule.models, { parallelAnimations: true })
    const { body, model } = makeCharacter(chetnikModule.description)
    const parts = model.mesh.getObjectsByProperty('isSkinnedMesh', true)
    const originals = parts.map(part => part.material)
    let dressed
    stage.setLook = candidate => {
      if (candidate && !dressed) {
        const textures = new Map()
        candidate.dress(model.mesh, textures)
        dressed = parts.map(part => part.material)
        stage.session.scope.add(() => {
          textures.forEach(texture => texture.dispose())
          parts.forEach((part, i) => dressed[i].forEach((material, j) => {
            if (material !== originals[i][j]) material.dispose()
          }))
        })
      }
      const materials = candidate ? dressed : originals
      parts.forEach((part, i) => {
        part.material = materials[i]
      })
    }
    stage.setLook(look)
    stage.add(body, model)
    return body
  },
}

export const ww2 = [
  germanHeavyInfantry,
  germanRifleman,
  character('nacisticki-agent-3d', 'Nacistički agent', library, naziAgentModule),
  character('nacisticki-oficir-3d', 'Nacistički oficir', '3D Tank, FPS Airport, FPS Base', naziOfficerModule),
  infantryStory('partizan-3d', 'Koča', 'Liberated City, Spomenici', partisanModule),
  infantryStory('partizan-jednostavan-model-3d', 'Sava', 'Liberated City', partisanLowpolyModule),
  workerFighter,
  ...prisoners,
  ...resistanceIdentities,
  character('ss-vojnik-3d', 'SS vojnik', '3D Tank, FPS Airport, FPS Base', sSSoldierModule),
  infantryStory('vojnik-3d', 'Vojnik', library, soldierModule),
  infantryStory('sovjetski-partizan-3d', 'Nikoletina', 'Liberated City', sovietPartisanModule),
  chetnikRifleman,
  {
    ...character('cetnik-subara-3d', 'Četnik sa šubarom', 'Siege of Kraljevo', subaraModule),
    catalogGroup: ['Vojnici', 'Četnici'],
    looks: [
      { id: 'original', name: 'Osnovna' },
      { id: 'pixel-art', name: 'Pixel art', value: true },
    ],
    async create(stage, way, pixelArt) {
      await requestModels(subaraModule.models, { parallelAnimations: true })
      const { body, model } = makeCharacter({ ...subaraModule.description, dress: undefined })
      stage.setLook = subaraModule.subaraLooks(model.mesh, stage.session.scope)
      stage.setLook(pixelArt)
      stage.add(body, model)
      return body
    },
  },
].flat()

function tankStory(id, name, game, module) {
  const story = character(id, name, game, module)
  return {
    ...story, catalogGroup: ['Vozila'],
    async create(stage) {
      await requestModels(module.models)
      const { body, model } = makeCharacter(module.description, { wreckState: true })
      stage.add(body, model)
      stage.controllers.push({
        update() {
          body.steer({ ahead: body.state === 'move' ? 1 : 0 })
        },
      })
      return body
    },
  }
}

export const vehicles = [
  tankStory('tenk-3d', 'Renault FT', 'FPS Airport', tankModule),
  tankStory('hotchkiss-h35-3d', 'Hotchkiss H35', 'Siege of Kraljevo', hotchkissModule),
]
