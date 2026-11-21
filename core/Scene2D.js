import Scene from './Scene.js'
import Renderer2D from './Renderer2D.js'
import { canvas2d } from '/core/io/canvas2d.js'

export default class Scene2D extends Scene {
  constructor({ canvas = canvas2d, ...params }) {
    super({ canvas, ...params })
    this.backgroundColor = null
    this.renderer = new Renderer2D({ canvas: this.canvas })
    this.audioWorldOffset = { x: 0, y: 0 }
    /** Top-left of the visible world; a scene with a camera moves it. Sounds off screen are not heard. */
    this.cameraX = this.cameraY = 0
    this.sceneAudio.setSpatialContext({
      coordinates: {
        dimensions: 2, unitsPerAudioUnit: 100, getWorldOffset: () => this.audioWorldOffset,
        getViewport: () => ({
          min: { x: this.cameraX, y: this.cameraY },
          max: { x: this.cameraX + this.canvas.width, y: this.cameraY + this.canvas.height },
        }),
      },
      getListener: () => {
        const player = this.audioPlayer?.() ?? this.player
        if (!player?.position) throw new Error('A spatial scene needs its actual player position')
        return { position: player.position, identity: player, revision: player.audioRevision ?? 0 }
      },
    })
  }

  clear() {
    this.renderer.clear({ background: this.background, backgroundColor: this.backgroundColor })
  }

  /** What the scene's camera shows; each scene has its own renderer, so the camera is the scene's alone. */
  render() {
    this.renderer.cameraX = this.cameraX
    this.renderer.cameraY = this.cameraY
    this.renderer.drawObjects(this.children)
  }
}
