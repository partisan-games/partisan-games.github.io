import SceneryLayer, * as sceneryModule from '/core/SceneryLayer.js'
import sceneryArt from '/core/sceneryArt.js'
import GameObject2D, * as pictureModule from '/core/actor/GameObject2D.js'
import Cover, * as coverModule from '/core/objects/Cover.js'
import { iconImages } from '/core/io/icons.js'

/** Adds a still prop to the stage. */
const put = (stage, prop) => {
  stage.add(prop)
  return prop
}

const fallen = { partisan: 'Pali partizan', german: 'Pali Nemac', italian: 'Pali Italijan' }
const lying = { prone: 'potrbuške', supine: 'na leđima', side: 'na boku' }
const names = { 'blood-patch': 'Mrlja krvi', 'blood-smear': 'Razmazana krv', 'blood-pool': 'Lokva krvi' }
const groups = { fallen: 'Pali borci', blood: 'Krv' }

/**
 * The still props games lay over their battlefields, one story each, in the group of what they are; the wrecks are
 * the dead state of their vehicles and guns, shown in those stories.
 */
const props = Object.entries(sceneryArt).filter(([, art]) => art.kind !== 'wreck').map(([id, art]) => {
  const [side, , pose] = id.split('-')
  return {
    id, name: names[id] ?? `${fallen[side]}, ${lying[pose]}`, game: 'Tenkići', block: sceneryModule,
    catalogGroup: ['Scenografija', groups[art.kind]],
    create: stage => put(stage, new SceneryLayer([{ id, x: stage.width / 2, y: stage.groundY }])),
  }
})

/** A picture standing on the middle of the ground line, its bottom on it. */
const standing = (stage, prop) => {
  Object.assign(prop, { x: stage.width / 2, y: stage.groundY - prop.height / 2 })
  return put(stage, prop)
}

/** Fit the whole picture on the stage after it loads, above the horizon or on the ground line. */
const picture = (stage, src, { scale = 1, onGround = true } = {}) => {
  const height = stage.groundY
  const prop = new GameObject2D(src, { x: stage.width / 2, y: height / 2, scale })
  prop.imageLoaded.then(() => {
    const fit = Math.min(1, stage.width * .9 / prop.width, height * .9 / prop.height)
    prop.width *= fit
    prop.height *= fit
    if (onGround) prop.placeOnGround(stage.groundY)
  })
  return put(stage, prop)
}

const pictures = [
  { id: 'crkva-do-trsta', name: 'Crkva', game: 'Do Trsta', group: 'Zgrade', src: 'game-ready/scenery/crkva-do-trsta.webp' },
  { id: 'kamena-kuca-do-trsta', name: 'Kamena kuća', game: 'Do Trsta', group: 'Zgrade',
    src: 'game-ready/scenery/do-trsta/kuca-04.webp' },
  { id: 'kuca-sa-dimnjakom-do-trsta', name: 'Kuća sa dimnjakom', game: 'Do Trsta', group: 'Zgrade',
    src: 'game-ready/scenery/do-trsta/kuca-07.webp' },
  { id: 'aerodrom-franjo-kluz', name: 'Zgrada aerodroma', game: 'Franjo Kluz', group: 'Zgrade',
    src: 'game-ready/scenery/franjo-kluz/aerodrom.webp' },
  { id: 'rusevina-franjo-kluz', name: 'Ruševina', game: 'Franjo Kluz', group: 'Zgrade',
    src: 'game-ready/scenery/franjo-kluz/ruina.webp' },
  { id: 'baza-vis', name: 'Baza na Visu', game: 'Vis', group: 'Zgrade',
    src: 'game-ready/scenery/vis/baza.webp', view: { onGround: false } },
  { id: 'ostrvo-vis', name: 'Ostrvo', game: 'Vis', group: 'Teren',
    src: 'game-ready/scenery/vis/ostrvo.webp', view: { scale: 2, onGround: false } },
  { id: 'sumarak', name: 'Šumarak', game: 'Do Trsta', group: 'Teren', src: 'game-ready/scenery/shumarak.webp' },
  { id: 'krater-neretva', name: 'Krater', game: 'Neretva', group: 'Tragovi rata', src: 'game-ready/scenery/neretva-crater.webp' },
  { id: 'granata', name: 'Granata', game: 'Franjo Kluz', group: 'Predmeti',
    src: iconImages.ammunition, view: { scale: 4, onGround: false } },
]

export const scenery = [
  ...props,
  ...pictures.map(({ id, name, game, group, src, view }) => ({
    id, name, game, block: pictureModule, catalogGroup: ['Scenografija', group],
    create: stage => picture(stage, src, view),
  })),
  ...[['rov', 'Rov', 'trench'], ['gomila-kamenja', 'Gomila kamenja', 'stones']].map(([id, name, kind]) => ({
    id, name, game: 'Neretva', block: coverModule, catalogGroup: ['Scenografija', 'Zakloni'],
    create: stage => standing(stage, new Cover({ kind, scale: 2 })),
  })),
]
