import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { randomGrayish, getEmptyCoords, sample, maxItems } from '/core3d/helpers.js'
import { createTrees } from '/core3d/geometry/trees.js'

const { randInt, randFloat } = THREE.MathUtils

const basicMaterial = new THREE.MeshStandardMaterial({ vertexColors: true })
const textureLoader = new THREE.TextureLoader()

const loadTexture = (filepath, halfWidth) => {
  const texture = textureLoader.load(filepath)
  if (halfWidth) texture.repeat.set(.5, 1)
  return texture
}

/* GRAFFITI */

const slogans = [
  `SMRT FAŠIZMU, 
  SLOBODA NARODU!`,
  `СМРТ ФАШИЗМУ, 
  СЛОБОДА НАРОДУ!`,
  `SMRT NARODNIM IZDAJICAMA
  USTAŠAMA I ČETNICIMA`,
  'ŽIVIO DRUG TITO',
  'ŽIVELA NARODNA VOJSKA!',
  'ЖИВИЛА НАРОДНА ВОЈСКА!',
  'UNIŠTIMO FAŠIZAM!',
  `15. SEPTEMBAR
  JE ZADNJI ROK!`,
  `NAROD ĆE SVOJU SLOBODU
  PISATI SAM!`,
  'NI ZRNO ŽITA OKUPATORU!',
  'ЖИВЕЛА НАРОДНА ВЛАСТ!',
  'KOMUNIZAM ĆE POBIJEDITI',
  'КОМУНИЗАМ ЋЕ ПОБИЈЕДИТИ',
  'SMRT OKUPATORU I IZDAJICAMA!',
  'ZGRABIMO ORUŽJE SVI!',
  'CRVENA ARMIJA DOLAZI',
  'ЦРВЕНА АРМИЈА ДОЛАЗИ',
  'U BORBU PROTIV OKUPATORA!',
  'SVI U PARTIZANE!',
  'СВИ У ПАРТИЗАНЕ!',
  `SVI NA FRONT
  SVE ZA FRONT!`,
  `ZAR TI JOŠ NE ZNAŠ
  ČITATI?`,
  `ЗАР ТИ ЈОШ НЕ ЗНАШ
  ЧИТАТИ?`,
  'ŽIVJELA CRVENA ARMIJA',
  `ŽIVILA KOMUNISTIČKA 
  PARTIJA JUGOSLAVIJE`,
  'ŽIVIO DRUG STARI',
]

/* TEXTURES */

const getWindowColor = ({ chance = .5 } = {}) => {
  const lightColors = [0xffff00, 0xF5F5DC, 0xFFEA00, 0xF6F1D5, 0xFFFF8F, 0xFFFDD0, 0xFBFFFF]
  const lightColor = lightColors[Math.floor(Math.random() * lightColors.length)]
  const randColor = Math.random() > chance ? 0x000000 : lightColor
  return new THREE.Color(randColor)
}

// https://www.25yearsofprogramming.com/threejs-tutorials/how-to-do-a-procedural-city-in-100-lines.html
export function createBuildingTexture({ night = false, wallColor = night ? '#151515' : '#FFFFFF', width = 16, height = 32, windowHeight = 4 } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.fillStyle = wallColor
  context.fillRect(0, 0, canvas.width, canvas.height)
  for (let y = windowHeight; y < canvas.height; y += windowHeight)
    for (let x = 0; x < canvas.width; x += windowHeight) {
      context.fillStyle = night
        ? getWindowColor({ chance: .25 }).getStyle()
        : randomGrayish({ min: 0, max: .5, colorful: 0 }).getStyle()
      context.fillRect(x, y, windowHeight, windowHeight / 2)
    }

  const canvas2 = document.createElement('canvas')
  canvas2.width = 512
  canvas2.height = 1024
  const context2 = canvas2.getContext('2d')
  context2.imageSmoothingEnabled = false
  context2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height)

  const texture = new THREE.CanvasTexture(canvas2)
  return texture
}

const webFonts = ['Arial', 'Verdana', 'Trebuchet MS']
const fontColors = ['red', 'blue', 'black', '#222222', 'green', 'purple']

// Adds word-wrap + vertical fit. Keeps your API. Comments in English.
// Word-wrap + bottom-aligned text block. Comments in English.

export function createGraffitiTexture({
  buildingWidth,
  buildingHeight,
  background,
  color = sample(fontColors),
  text = sample(slogans),
  fontFamily = sample(webFonts),
  resolution = 24
} = {}) {
  const width = buildingWidth * resolution
  const height = buildingHeight * resolution

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = new THREE.Color(background).getStyle()
  ctx.fillRect(0, 0, width, height)

  const lines = String(text).split('\n')
  const maxW = width * 0.8 // padding
  const minFontSize = 8
  let fontSize = Math.max(8, (width * 0.09) | 0)

  for (; fontSize > minFontSize; fontSize--) {
    ctx.font = `bold ${fontSize}px ${fontFamily}`
    if (lines.every(l => ctx.measureText(l).width <= maxW)) break
  }

  const lineH = Math.ceil(fontSize * 1.15)
  const x = width * 0.5

  const marginBottom = height * 0.1 // 10% of height
  const totalTextHeight = lines.length * lineH
  const y0 = height - marginBottom - totalTextHeight + lineH / 2

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color

  for (let i = 0; i < lines.length; i++) {
    const y = y0 + i * lineH
    const rot = Math.random() < 0.4 ? (Math.random() * 0.1 - 0.05) : 0 // ~±0.05 rad
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.font = `bold ${fontSize}px ${fontFamily}`
    ctx.fillText(lines[i], 0, 0)
    ctx.restore()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping

  return texture
}

/* WINDOWS */

function createWindow(windowWidth, windowHeight) {
  const geometry = new THREE.PlaneGeometry(windowWidth, windowHeight)
  const color = getWindowColor()

  const colors = []
  for (let i = 0, l = geometry.attributes.position.count; i < l; i++)
    colors.push(color.r, color.g, color.b)

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

  return geometry
}

function createWindows(bWidth, bHeight) {
  const windows = []
  const windowWidth = bWidth / 8
  const windowHeight = randFloat(bHeight / 16, bHeight / 8)
  const floors = Math.floor(bHeight / (windowHeight * 2))
  const halfBWidth = bWidth * .5

  const getWindowY = floor => {
    const currY = floor * windowHeight * 2
    const groundLevel = -bHeight * .5 + windowHeight * .5
    const buildingMargins = bHeight - (windowHeight * 2 * floors)
    const y = groundLevel + currY + (buildingMargins / 2) + (windowHeight / 2)
    return y
  }

  const createSideWindows = callback => {
    for (let i = 0; i < bWidth / windowWidth / 2; i++)
      for (let floor = 0; floor < floors; floor++) {
        const geometry = createWindow(windowWidth, windowHeight)
        const currX = windowWidth + i * windowWidth * 2 - halfBWidth
        callback(geometry, currX, floor)
        geometry.translate(0, getWindowY(floor), 0)
        windows.push(geometry)
      }
  }

  createSideWindows((geometry, currX) => {
    geometry.translate(currX, 0, halfBWidth)
  })
  createSideWindows((geometry, currX) => {
    geometry.rotateY(Math.PI)
    geometry.translate(currX, 0, -halfBWidth)
  })
  createSideWindows((geometry, currX) => {
    geometry.rotateY(Math.PI * .5)
    geometry.translate(halfBWidth, 0, currX)
  })
  createSideWindows((geometry, currX) => {
    geometry.rotateY(-Math.PI * .5)
    geometry.translate(-halfBWidth, 0, currX)
  })
  return windows
}

/* BUILDING */

export function createBuildingGeometry({
  color = randomGrayish({ min: .3, max: .6 }), width = randInt(10, 20), height = randInt(width, width * 4), depth = width, x = 0, z = 0, y = height * .5, addWindows = false, rotY = 0,
} = {}) {

  const geometry = new THREE.BoxGeometry(width, height, depth)

  if (color?.isColor) { // is THREE.Color
    const colors = []
    for (let i = 0, l = geometry.attributes.position.count; i < l; i++)
      colors.push(color.r, color.g, color.b)
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  }

  const mergedGeometry = addWindows
    ? BufferGeometryUtils.mergeGeometries([geometry, ...createWindows(width, height)])
    : geometry

  mergedGeometry.translate(x, y, z) // needed for merge
  if (rotY) mergedGeometry.rotateY(rotY)

  return mergedGeometry
}

export function createBuilding(params = {}) {
  const { map, color, ...rest } = params
  const geometry = createBuildingGeometry(rest)

  const materialParams = { vertexColors: !color }
  if (map) materialParams.map = map
  if (color) materialParams.color = color
  const material = new THREE.MeshLambertMaterial(materialParams)

  return new THREE.Mesh(geometry, material)
}

export function createTexturedBuilding({ width, height, depth = width, color = 0x999999, path = '/assets/images/textures/', files = [], defaultFile, halfOnSides = false, graffitiChance = 0, ...rest } = {}) {
  const geometry = createBuildingGeometry({ width, height, depth, ...rest })
  const { width: buildingWidth, height: buildingHeight } = geometry.parameters // could be random values

  const createTexture = (half = false) => defaultFile
    ? loadTexture(path + defaultFile, half)
    : Math.random() < graffitiChance
      ? createGraffitiTexture({ background: color, buildingWidth, buildingHeight })
      : createBuildingTexture({ width: buildingWidth, height: buildingHeight })

  const textures = files.map((file, i) => file
    ? loadTexture(path + file, halfOnSides && (i == 0 || i == 1))  // right || left
    : null
  )

  const materials = [
    new THREE.MeshPhongMaterial({ map: textures[0] || createTexture(halfOnSides) }),  // 0: right
    new THREE.MeshPhongMaterial({ map: textures[1] || createTexture(halfOnSides) }),  // 1: left
    new THREE.MeshPhongMaterial({ map: textures[2] || null, color }),                 // 2: top
    new THREE.MeshBasicMaterial({ color }),                                           // no bottom
    new THREE.MeshPhongMaterial({ map: textures[3] || createTexture() }),             // 3: front
    new THREE.MeshPhongMaterial({ map: textures[4] || createTexture() }),             // 4: back
  ]

  const mesh = new THREE.Mesh(geometry, materials)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

// returns an array with an image at random index (for one wall) and rest empty
const getTextures = () => {
  const posters = [
    '15_rujan_zadnji_rok.webp', 'iz_naroda_hlapcev.webp', 'kultura_fasizma.jpg', 'ni_zrno_zita_okupatoru.webp', 'omladina_jugoslavije.webp', 'partizanka.webp', 'petokolonas_vreba.jpg', 'RED_ARMY_IS_HERE.jpg', 'smrt_fasizmu_sloboda_narodu.webp', 'svi_na_front.webp', 'svi_u_NOVJ.webp', 'tko bude uhvacen da pljacka.jpg', 'zar_ti_jos_ne_znas_citati.webp', 'zgrabimo_za_orozje_vsi.webp', 'zivio_27_mart.webp'
  ]
  const ruins = ['ruin-01.jpg', 'ruin-02.jpg', 'ruin-03.jpg', 'ruin-04.jpg', 'ruin-back.jpg', 'warehouse.jpg']
  const files = []
  files[sample([0, 1, 3, 4])] = Math.random() > .25 ? 'buildings/' + sample(ruins) : 'posters/' + sample(posters)
  return files
}

export const createGraffitiBuilding = param => createTexturedBuilding({ graffitiChance: 1, files: getTextures(), ...param })

export const createWarehouse = () => createTexturedBuilding({ width: 20, height: 10, depth: 10, defaultFile: 'buildings/warehouse.jpg', files: [null, null, 'terrain/concrete.jpg'], halfOnSides: true })

export const createWarehouse2 = () => createTexturedBuilding({ width: 20, height: 10, depth: 20, defaultFile: 'buildings/warehouse.jpg', files: [null, null, 'terrain/concrete.jpg'] })

export const createWarRuin = () => createTexturedBuilding({ width: 12, height: 10, depth: 12, defaultFile: 'buildings/ruin-01.jpg', files: [null, null, 'terrain/beton-krater.jpg'] })

export const createRuin = () => createTexturedBuilding({ width: 12, height: 10, depth: 12, defaultFile: 'buildings/ruin-front.jpg' })

export const createAirport = () => createTexturedBuilding({ width: 20, height: 10, depth: 10, defaultFile: 'buildings/airport.png', files: [null, null, 'terrain/beton.gif'], halfOnSides: true })

/* CITY */

const shouldRotate = (rotateEvery, i) => rotateEvery && i % rotateEvery == 0

const shouldEnlarge = (enlargeEvery, i) => enlargeEvery && i % enlargeEvery == 0

export function createCity({
  mapSize = 400, fieldSize = 20, numBuildings = maxItems(mapSize, fieldSize) / 2, emptyCenter = 0, coords = getEmptyCoords({ mapSize, fieldSize, emptyCenter }), rotateEvery = 9, enlargeEvery = 0, addWindows = false, colorParams = { min: 0, max: .1, colorful: .1 }, map, castShadow = true, receiveShadow = true, numLampposts = 0, numTrees = 0
} = {}) {
  const buildings = []

  for (let i = 0; i < numBuildings; i++) {
    const color = colorParams ? randomGrayish(colorParams) : new THREE.Color(0x000000)
    const { x, z } = coords.pop()

    const rotY = shouldRotate(rotateEvery, i) ? Math.random() * Math.PI : 0
    const bWidth = shouldEnlarge(enlargeEvery, i)
      ? randFloat(fieldSize * .5, fieldSize * 1.25)
      : randFloat(fieldSize * .5, fieldSize)
    const bHeight = shouldEnlarge(enlargeEvery, i)
      ? randFloat(bWidth * 4, bWidth * 6)
      : randFloat(bWidth, bWidth * 4)

    const geometry = createBuildingGeometry({ color, x, z, rotY, addWindows, width: bWidth, height: bHeight })
    buildings.push(geometry)
  }

  const merged = BufferGeometryUtils.mergeGeometries(buildings)
  const material = map
    ? new THREE.MeshLambertMaterial({ map, vertexColors: true })
    : basicMaterial

  const city = new THREE.Mesh(merged, material)
  city.castShadow = castShadow
  city.receiveShadow = receiveShadow

  if (numLampposts)
    city.add(createLampposts({ coords, numLampposts }))

  if (numTrees)
    city.add(createTrees({ coords, n: numTrees }))

  return city
}

export const createNightCity = ({ addWindows = true, colorParams = null, numLampposts = 15, ...rest } = {}) => createCity({ addWindows, colorParams, numLampposts, ...rest })

export const createTexturedCity = param => createCity({ numBuildings: 10000, rotateEvery: 2, enlargeEvery: 10, map: createBuildingTexture(), colorParams: { colorful: .035, max: 1 }, ...param })

/* CITY LIGHTS */

function createLamppost({ x = 0, z = 0, height = 20 } = {}) {
  const group = new THREE.Group()

  const sphereGeometry = new THREE.SphereGeometry(1.5, 12, 16)
  const colors = [0xF5F5DC, 0xdceff5, 0xFFFF8F, 0xFFFDD0]
  const color = colors[Math.floor(Math.random() * colors.length)]
  const sphereMaterial = new THREE.MeshBasicMaterial({ color })
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  sphere.position.set(x, height, z)
  group.add(sphere)

  const cylinderGeometry = new THREE.CylinderGeometry(.25, .25, height, 6)
  const cylinderMaterial = new THREE.MeshPhongMaterial({ color: 0x242731 })
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial)
  cylinder.position.set(x, height * .5, z)
  group.add(cylinder)

  const lamppost = new THREE.SpotLight(color)
  lamppost.position.set(x, height, z)
  lamppost.target.position.set(x, 0, z)
  lamppost.target.updateMatrixWorld()

  lamppost.angle = randFloat(Math.PI / 6, Math.PI / 3)
  lamppost.intensity = randFloat(.5, 2) // 1.8 // 0-2
  lamppost.penumbra = 0.5
  lamppost.distance = height * 2

  lamppost.castShadow = true
  group.add(lamppost)

  return group
}

export function createLampposts({ mapSize = 200, coords = getEmptyCoords({ mapSize }), numLampposts = 10, height } = {}) {
  const group = new THREE.Group()
  for (let i = 0; i < numLampposts; i++) {
    const { x, z } = coords.pop()
    const lamppost = createLamppost({ x, z, height })
    group.add(lamppost)
  }
  return group
}

export function createCityLights({ mapSize, coords = getEmptyCoords({ mapSize }), numLights = 4, height = 10 } = {}) {
  const group = new THREE.Group()
  for (let i = 0; i < numLights; i++) {
    const light = new THREE.SpotLight(0xF5F5DC)
    const { x, z } = coords.pop()
    light.position.set(x, height, z)
    light.castShadow = true
    group.add(light)
  }
  return group
}