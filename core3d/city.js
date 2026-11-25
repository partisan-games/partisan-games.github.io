import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { randomGrayish, sample } from '/core3d/helpers.js'
import { assets } from '/config.js'

const { randInt, randFloat } = THREE.MathUtils

const textureLoader = new THREE.TextureLoader()

const loadTexture = (filepath, halfWidth) => {
  const texture = textureLoader.load(filepath)
  if (halfWidth) texture.repeat.set(.5, 1)
  return texture
}

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

/** Fits the lines into the lower part of the wall, each slightly tilted at random. */
function drawGraffitiText(ctx, { text, fontFamily, color }) {
  const { width, height } = ctx.canvas
  const lines = String(text).split('\n')
  const maxW = width * 0.8
  const minFontSize = 8
  let fontSize = Math.max(8, (width * 0.09) | 0)

  for (; fontSize > minFontSize; fontSize--) {
    ctx.font = `bold ${fontSize}px ${fontFamily}`
    if (lines.every(l => ctx.measureText(l).width <= maxW)) break
  }

  const lineH = Math.ceil(fontSize * 1.15)
  const x = width * 0.5
  const marginBottom = height * 0.1
  const y0 = height - marginBottom - lines.length * lineH + lineH / 2

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color

  for (let i = 0; i < lines.length; i++) {
    const rot = Math.random() < 0.4 ? (Math.random() * 0.1 - 0.05) : 0
    ctx.save()
    ctx.translate(x, y0 + i * lineH)
    ctx.rotate(rot)
    ctx.fillText(lines[i], 0, 0)
    ctx.restore()
  }
}

/** A poster at most a third of the wall, in its middle. */
function drawSmallPoster(ctx, img) {
  const { width, height } = ctx.canvas
  const scale = Math.min(width / 3 / img.width, height / 3 / img.height)
  const imgW = img.width * scale
  const imgH = img.height * scale
  ctx.drawImage(img, (width - imgW) / 2, (height - imgH) / 2, imgW, imgH)
}

function createGraffitiTexture({
  buildingWidth,
  buildingHeight,
  background,
  text,
  fontColors = ['red', 'black', '#222222', 'brown'],
  color = sample(fontColors),
  webFonts = ['Arial', 'Verdana', 'Trebuchet MS'],
  fontFamily = sample(webFonts),
  resolution = 64,
  graffitiBgTexture,
  poster,
  bigMural = false
} = {}) {
  const canvas = document.createElement('canvas')
  const canvasWidth = canvas.width = buildingWidth * resolution
  const canvasHeight = canvas.height = buildingHeight * resolution
  const ctx = canvas.getContext('2d')

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping

  const drawText = () => drawGraffitiText(ctx, { text, fontFamily, color })

  const drawArtAndText = () => {
    if (poster) {
      const img = new Image()
      img.src = assets.textures + poster
      img.onload = () => {
        if (bigMural)
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
        else { // small poster + text
          drawSmallPoster(ctx, img)
          drawText()
        }
        texture.needsUpdate = true
      }
    } else
      drawText()
  }

  if (graffitiBgTexture) {
    const img = new Image()
    img.src = assets.textures + graffitiBgTexture
    img.onload = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
      drawArtAndText()
      texture.needsUpdate = true
    }
  } else {
    ctx.fillStyle = new THREE.Color(background).getStyle()
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    drawArtAndText()
  }

  return texture
}

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

export function createTexturedBuilding({ width, height, depth = width, color = 0x999999, path = assets.textures, files = [], defaultFile, halfOnSides = false, graffitiChance = 0, posters = [], slogans = [], postersPath = 'posters/', graffitiBgTexture, webFonts, fontColors, bigMural = false, ...rest } = {}) {
  const geometry = createBuildingGeometry({ width, height, depth, ...rest })
  const { width: buildingWidth, height: buildingHeight } = geometry.parameters

  const textures = Array(5).fill().map((x, i) => {
    const halfWidth = halfOnSides && (i === 0 || i === 1)
    if (files[i]) return loadTexture(path + files[i], halfWidth)

    if (i === 2) return null // roof no texture

    if (Math.random() < graffitiChance) return createGraffitiTexture({
      background: color,
      buildingWidth,
      buildingHeight,
      graffitiBgTexture,
      poster: posters.length > 0 && Math.random() > .66 && postersPath + sample(posters),
      text: sample(slogans),
      bigMural,
      webFonts,
      fontColors,
    })

    if (defaultFile) return loadTexture(path + defaultFile, halfWidth)

    return createBuildingTexture({ width: buildingWidth, height: buildingHeight })
  })

  const materials = [
    new THREE.MeshPhongMaterial({ map: textures[0] }),          // 0: right
    new THREE.MeshPhongMaterial({ map: textures[1] }),          // 1: left
    new THREE.MeshPhongMaterial({ map: textures[2], color }),   // 2: top
    new THREE.MeshBasicMaterial({ color }),                     // no bottom
    new THREE.MeshPhongMaterial({ map: textures[3] }),          // 3: front
    new THREE.MeshPhongMaterial({ map: textures[4] }),          // 4: back
  ]

  const mesh = new THREE.Mesh(geometry, materials)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export const createGraffitiBuilding = param => createTexturedBuilding({ graffitiChance: .2, ...param })

export const createWarehouse = () => createTexturedBuilding({ width: 20, height: 10, depth: 10, defaultFile: 'buildings/warehouse.jpg', files: [null, null, 'terrain/concrete.jpg'], halfOnSides: true })

export const createWarehouse2 = () => createTexturedBuilding({ width: 20, height: 10, depth: 20, defaultFile: 'buildings/warehouse.jpg', files: [null, null, 'terrain/concrete.jpg'] })

export const createWarRuin = () => createTexturedBuilding({ width: 12, height: 10, depth: 12, defaultFile: 'buildings/ruin-01.jpg', files: [null, null, 'terrain/beton-krater.jpg'] })

export const createRuin = () => createTexturedBuilding({ width: 12, height: 10, depth: 12, defaultFile: 'buildings/ruin-front.jpg' })

export const createAirport = () => createTexturedBuilding({ width: 20, height: 10, depth: 10, defaultFile: 'buildings/airport.png', files: [null, null, 'terrain/beton.gif'], halfOnSides: true })
