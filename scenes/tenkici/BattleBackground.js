import { assets } from '/config.js'
import Sound from '/core/io/audio/SoundSource.js'
import renderLayers from './renderLayers.js'
import imageReady from '/core/io/imageReady.js'

/** A smoke column over a burning spot, with its look; spots without their own column get this one. */
const defaultColumn = { broj: 26, trajanje: 16, speed: 16, vetar: 3, sirenje: 5, vijuganje: 8, nijansa: 40 }

/** A burning spot of a picture's metadata, in its source pixels, as a fire and a smoke column in the effects layer. */
const burning = (x, y, intensity, faza, seme) => ({
  pozari: [{ x: x / 2, y: y / 2, velicina: intensity, faza }],
  stuboviDima: [{ x: x / 2, y: y / 2, faza, seme, ...defaultColumn }],
})

/**
 * The places a battle can be fought in front of: a picture and where it burns. Fires and smoke columns are in the
 * pixels of the effects layer, half the picture's size; a fire's `velicina` is its strength. `ground` is the share of
 * the picture's height where its flat strip of ground begins, which is drawn on the scene's ground line.
 */
export const battlefields = {
  city: {
    src: 'background/razrusen-grad-ww2-pixel.png', width: 724, height: 543, ground: 395 / 543,
    pozari: [
      { x: 176, y: 365, velicina: 1, faza: 0 },
      { x: 520, y: 241, velicina: .65, faza: 2.7 },
      { x: 604, y: 230, velicina: .4, faza: 5.1 },
    ],
    stuboviDima: [
      { x: 520, y: 241, faza: 2.7, broj: 32, trajanje: 16, speed: 18, vetar: 1.9, sirenje: 4.1, vijuganje: 5, seme: 1.3, nijansa: 36 },
      { x: 604, y: 230, faza: 5.1, broj: 26, trajanje: 17, speed: 16, vetar: 5.4, sirenje: 6.2, vijuganje: 11, seme: 4.7, nijansa: 45 },
    ],
  },
  // from assets/images/sources/pozadine/backgrounds.json, its source pixels halved
  bihac: {
    src: 'background/bihac-ww2-pixel.png', width: 768, height: 512, ground: 818 / 1024,
    pozari: [{ x: 85, y: 272, velicina: .55, faza: 0 }, { x: 705, y: 284, velicina: .6, faza: 2.7 }],
    stuboviDima: [{ x: 388, y: 249, faza: 1.2, seme: 1.3, ...defaultColumn }],
  },
  // from assets/images/sources/pozadine/seasonal-backgrounds.json: the raid of May 1944, with nothing burning
  drvar: {
    src: 'background/drvar-spring-1944-pixel.png', width: 768, height: 512, ground: 814 / 1024,
    pozari: [], stuboviDima: [],
  },
  uzice: {
    src: 'background/uzice-ww2-pixel.png', width: 768, height: 512, ground: 813 / 1024,
    pozari: [{ x: 670, y: 295, velicina: .6, faza: 0 }, { x: 500, y: 270, velicina: .3, faza: 4.2 }],
    stuboviDima: [{ x: 610, y: 254, faza: 2.4, seme: 3.6, ...defaultColumn }],
  },
  // from assets/images/sources/pozadine/current-backgrounds.json
  sremFront1944: {
    src: 'background/sremski-front-1944-static.png', width: 768, height: 512, ground: 828 / 1024,
    ...burning(300, 370, .25, 0, 1.1),
  },
  // Selected animated Batina: sky, drifting clouds, environment and ambient characters.
  batina: {
    src: 'background/batina-1944/base.png', layers: 'background/batina-1944/',
    width: 768, height: 512, ground: 852 / 1024, pozari: [], stuboviDima: [],
  },
  sremFront1945: {
    src: 'background/sremski-front-1945-static.png', width: 768, height: 512, ground: 852 / 1024,
    ...burning(280, 390, .25, 3.2, 3.9),
  },
  grahovo: {
    src: 'background/grahovo-1941-war-sparse-static.png', width: 768, height: 512, ground: 852 / 1024,
    ...burning(220, 387, .25, .6, 1.6),
  },
  vilusi: {
    src: 'background/vilusi-1941-static.png', width: 768, height: 512, ground: 854 / 1024,
    ...burning(1320, 522, .25, 2.2, 2.9),
  },
  niksic: {
    src: 'background/niksic-1941-static.png', width: 768, height: 512, ground: 798 / 1024,
    ...burning(260, 475, .25, 4.1, 4.4),
  },
}

/**
 * A battlefield picture with its fires and smoke drawn live over it; the fire is heard from where it burns, if anywhere. The
 * picture's ground strip lands on `groundY`, the scene's ground line, which is where its own ground is by default.
 * A place with `layers` is a folder of animated layers (base.png, clouds.png, actors.png and layout.json), which
 * renderLayers composes by the scene's time, instead of one still picture.
 */
export default class BattleBackground {
  constructor(canvas, place = battlefields.city, { groundY } = {}) {
    const { width, height, pozari } = place
    const points = () => pozari.map(fire => this.toCanvas(fire.x, fire.y))
    const area = () => ({
      min: { x: Math.min(...points().map(p => p.x)), y: Math.min(...points().map(p => p.y)) },
      max: { x: Math.max(...points().map(p => p.x)), y: Math.max(...points().map(p => p.y)) },
    })
    this.fireSound = new Sound('fire.mp3', { volume: .6, loop: true, profile: 'fire', ambienceKey: this, spatial: { getArea: area } })
    this.sounds = [this.fireSound]
    this.place = place
    this.canvas = canvas
    this.sceneGroundY = groundY
    this.ctx = canvas.getContext('2d')
    this.image = new Image()
    this.image.src = `${assets.images}${place.src}`
    if (place.layers) {
      this.imageLoaded = this.loadLayers(`${assets.images}${place.layers}`)
      // Scene.imagesLoaded owns the rejection; loading may fail before it starts waiting.
      this.imageLoaded.catch(() => {})
    }
    this.efekti = document.createElement('canvas')
    this.efekti.width = width
    this.efekti.height = height
    this.crtez = this.efekti.getContext('2d')
    this.vreme = 0
    /** Whether the battlefield is shown, so its fire is heard. */
    this.active = true
  }

  /** The scene waits for every layer before starting; a failed resource follows its loading error path. */
  async loadLayers(folder) {
    const image = name => Object.assign(new Image(), { src: `${folder}${name}` })
    const clouds = image('clouds.png'), actors = image('actors.png')
    const [layout] = await Promise.all([
      fetch(`${folder}layout.json`).then(response => {
        if (!response.ok) throw new Error(`Background layout could not be loaded: ${folder}layout.json`)
        return response.json()
      }),
      imageReady(this.image), imageReady(clouds), imageReady(actors),
    ])
    this.scene = Object.assign(document.createElement('canvas'), { width: layout.width, height: layout.height })
    this.layers = { render: renderLayers, layout, images: { base: this.image, clouds, actors } }
  }

  /** The picture to draw now: the still one, or the animated layers composed at time `t`. */
  picture(t) {
    if (!this.place.layers) return this.image
    const { layers, scene } = this
    if (!layers || !Object.values(layers.images).every(image => image.complete && image.naturalWidth)) return null
    layers.render(scene.getContext('2d'), layers.images, layers.layout, t)
    return scene
  }

  /** Where the scene's ground line is on the canvas. */
  get groundY() {
    return this.sceneGroundY ?? this.canvas.height * this.place.ground
  }

  /** A point of the effects layer on the canvas, above and below the ground line as the picture is drawn. */
  toCanvas(x, y) {
    const { width, height, ground } = this.place
    const horizon = height * ground, { groundY, canvas } = this
    return {
      x: x * canvas.width / width,
      y: y < horizon ? y * groundY / horizon : groundY + (y - horizon) * (canvas.height - groundY) / (height - horizon),
    }
  }

  /** Draws `picture` with its ground strip on the ground line: the part above stretched to it, the rest below it. */
  drawOnGround(picture, width, height) {
    const { ctx, canvas, groundY } = this
    const horizon = height * this.place.ground
    ctx.drawImage(picture, 0, 0, width, horizon, 0, 0, canvas.width, groundY)
    ctx.drawImage(picture, 0, horizon, width, height - horizon, 0, groundY, canvas.width, canvas.height - groundY)
  }

  update(dt) {
    this.vreme += dt
    this.fireSound.setPlaying(this.active && this.place.pozari.length > 0)
  }

  gustiDim(t, profil, windSpeed) {
    const ctx = this.crtez
    const { x: izvorX, y: izvorY, faza, broj, trajanje, speed, vetar, sirenje, vijuganje, seme, nijansa } = profil
    for (let i = 0; i < broj; i++) {
      const starost = (t + faza + i * trajanje / broj) % trajanje
      const nestajanje = Math.min(1, starost / .8, (trajanje - starost) / 3)
      const razvitak = Math.min(1, starost / 3)
      const x = izvorX + starost * (windSpeed ?? vetar)
        + Math.sin(starost * .55 + seme) * vijuganje * razvitak
        + Math.sin(i * 2.3 + seme) * 3 * razvitak
      const y = izvorY - 5 - starost * speed
      const poluprecnik = (3 + Math.sqrt(starost) * sirenje)
        * (.85 + .2 * Math.sin(i * 1.7 + seme))
      const ton = nijansa + (i % 3) * 5
      ctx.fillStyle = `rgba(${ton}, ${ton - 1}, ${ton + 3}, ${nestajanje * .65})`
      // Unequal billows keep each column distinct instead of forming matching cones.
      ctx.beginPath()
      for (let deo = 0; deo < 5; deo++) {
        const angle = deo * Math.PI * 2 / 5 + i * 2.1 + seme
        const cx = Math.round(x + Math.cos(angle) * poluprecnik * .45)
        const cy = Math.round(y + Math.sin(angle) * poluprecnik * .35)
        const r = Math.max(1, Math.round(poluprecnik * (.6 + .15 * Math.sin(deo * 2 + i + seme))))
        ctx.moveTo(cx + r, cy)
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
      }
      ctx.fill()
    }
  }

  dim(t, windSpeed) {
    const ctx = this.crtez
    for (const { x, y, velicina, faza } of this.place.pozari) {
      ctx.save()
      ctx.translate(x, y - 5 * velicina)
      ctx.scale(velicina, velicina)
      // Each puff follows a continuous path and fades before its slot is reused.
      for (let i = 0; i < 24; i++) {
        const trajanje = 6 + (i % 3) * .6
        const starost = (t + faza + i * trajanje / 24) % trajanje
        const napredak = starost / trajanje
        const alpha = Math.sin(Math.PI * napredak) ** 2 * .15
        const centarX = starost * (windSpeed === undefined ? 2 : windSpeed / velicina)
          + Math.sin(starost * .8 + i * 2.4) * starost * 1.1
        const centarY = -starost * 10
        const poluprecnik = 3 + starost * 2.7
        ctx.fillStyle = `rgba(76, 73, 71, ${alpha})`
        // Small overlapping pixel clusters, without a blurred or white halo.
        for (let red = -3; red <= 3; red++) {
          const polaSirine = Math.sqrt(1 - (red / 4) ** 2) * poluprecnik
          ctx.fillRect(
            Math.round(centarX - polaSirine),
            Math.round(centarY + red * poluprecnik / 4),
            Math.ceil(polaSirine * 2), Math.ceil(poluprecnik / 4)
          )
        }
      }
      ctx.restore()
    }
  }

  vatra(t, windSpeed = 0) {
    const ctx = this.crtez
    for (const { x, y, velicina, faza } of this.place.pozari) {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(velicina, velicina)
      const vreme = t + faza
      // The base stays on the rubble; only the tips bend and change height.
      for (let i = -8; i <= 8; i++) {
        const visinaPlamena = (1 - Math.abs(i) / 12)
          * (13 + 4 * Math.sin(vreme * 5 + i * .7) + 3 * Math.sin(vreme * 8 - i))
        for (let h = 0; h < visinaPlamena; h++) {
          const otklon = Math.sin(vreme * 4 + h * .35 + i) * h * .12 + windSpeed / 60 * h
          ctx.fillStyle = h < visinaPlamena * .3 ? '#f6c768'
            : h < visinaPlamena * .65 ? '#df8739' : '#aa4829'
          ctx.fillRect(i + Math.round(otklon), -h, 1, 1)
        }
      }
      ctx.restore()
    }
  }

  render(t = this.vreme, windSpeed) {
    const { ctx, image, efekti } = this
    if (!image.complete || !image.naturalWidth) return
    const picture = this.picture(t)
    if (!picture) return
    ctx.save()
    ctx.filter = 'sepia(20%)'
    this.drawOnGround(picture, picture.naturalWidth ?? picture.width, picture.naturalHeight ?? picture.height)
    ctx.restore()
    this.crtez.clearRect(0, 0, this.efekti.width, this.efekti.height)
    for (const profil of this.place.stuboviDima) this.gustiDim(t, profil, windSpeed)
    this.dim(t, windSpeed)
    this.vatra(t, windSpeed)
    ctx.save()
    ctx.imageSmoothingEnabled = false
    this.drawOnGround(efekti, efekti.width, efekti.height)
    ctx.restore()
  }
}
