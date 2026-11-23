import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from 'three'

function drawRunway(ctx) {
  // The eastern strip runs between the hangars and the edge of the airfield.
  ctx.translate(89, 0)
  ctx.fillStyle = 'rgba(39, 38, 36, .28)'
  ctx.fillRect(-7.5, -85, 15, 170)
  ctx.fillStyle = 'rgba(226, 223, 208, .76)'
  ctx.fillRect(7, -85, .24, 170)
  for (const [start, end] of [[-85, -55], [-45, 39], [49, 85]])
    ctx.fillRect(-7.2, start, .24, end - start)
  for (let z = -66; z <= 66; z += 12) ctx.fillRect(-.25, z - 3, .5, 6)
  for (const end of [-1, 1])
    for (const x of [-5.5, -3.6, -1.7, 1.7, 3.6, 5.5])
      ctx.fillRect(x - .36, end * 80 - 2.8, .72, 5.6)

  ctx.lineWidth = .22
  ctx.strokeStyle = 'rgba(214, 198, 150, .64)'
  for (const z of [-50, 44]) {
    ctx.beginPath()
    ctx.moveTo(-.5, z - 12)
    ctx.quadraticCurveTo(-.5, z, -12, z)
    ctx.lineTo(-37, z)
    ctx.stroke()
  }

  // Expose flecks and streaks of the original asphalt through the paint.
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = 'rgba(0, 0, 0, .55)'
  for (let i = 0; i < 5000; i++)
    ctx.fillRect(-7.5 + Math.random() * 15, -85 + Math.random() * 170,
      .08 + Math.random() * .32, .12 + Math.random() * .5)

}

function drawWheelTracks(ctx, aircraft) {
  for (const { x, z, size } of aircraft) {
    ctx.save()
    ctx.translate(x, z)
    // Turn the tracks toward the apron along the aircraft's longitudinal axis.
    const spanAlongZ = size.length > size.width
    ctx.rotate(spanAlongZ ? Math.sign(x) * Math.PI / 2 : (z > 0 ? Math.PI : 0))
    const span = Math.max(size.width, size.length)
    const reach = 5 + span
    const rubber = ctx.createLinearGradient(0, 0, 0, reach)
    rubber.addColorStop(0, 'rgba(44, 42, 40, .52)')
    rubber.addColorStop(1, 'rgba(44, 42, 40, 0)')
    ctx.strokeStyle = rubber
    ctx.lineWidth = .22
    for (const side of [-1, 1]) {
      const wheel = side * span * .15
      ctx.beginPath()
      ctx.moveTo(wheel, 0)
      ctx.quadraticCurveTo(wheel, reach * .6, wheel + 1.5, reach)
      ctx.stroke()
    }
    ctx.restore()
  }
}

export default function airfieldMarkings(size, aircraft) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 2048
  const ctx = canvas.getContext('2d')
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.scale(canvas.width / size, canvas.height / size)
  ctx.save()
  drawRunway(ctx)
  ctx.restore()
  drawWheelTracks(ctx, aircraft)

  const map = new CanvasTexture(canvas)
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 8
  const material = new MeshBasicMaterial({ map, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
  return new Mesh(new PlaneGeometry(size, size).rotateX(-Math.PI / 2), material)
}
