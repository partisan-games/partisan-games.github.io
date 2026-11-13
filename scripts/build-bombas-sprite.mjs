import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

// Work at the original pixel resolution so a new pose cannot redesign the character.
const source = 'assets/images/armies/partizani/vojnici/bombasi/partizan-bombas.gif'
const destination = 'assets/images/sprites/vojnici/bombas-idle.png'
const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage()
  const result = await page.evaluate(async data => {
    const image = new Image()
    image.src = data
    await image.decode()
    const { naturalWidth: width, naturalHeight: height } = image
    const canvas = document.createElement('canvas')
    canvas.width = width * 8
    canvas.height = height * 2
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    const original = ctx.getImageData(0, 0, width, height)
    const bent = ctx.createImageData(width, height)

    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const from = (y * width + x) * 4
        if (!original.data[from + 3]) continue
        // Lower the pelvis by one pixel, flex each knee outward by one pixel,
        // and leave the boots anchored. Never scale or interpolate the artwork.
        const knee = y >= 44 && y <= 54
        const offsetX = knee ? (x < 40 ? -1 : 1) : 0
        const offsetY = y < 50 ? 1 : 0
        const to = ((y + offsetY) * width + x + offsetX) * 4
        bent.data.set(original.data.subarray(from, from + 4), to)
      }

    ctx.putImageData(bent, width, 0)
    // Each step has contact, weight acceptance, passing and toe-off poses.
    // The points describe new limb silhouettes, not offsets applied to the old legs.
    const poses = [
      { down: 0, front: 'left', left: [[40, 52], [47, 66], [54, 69]], right: [[35, 52], [26, 65], [32, 69]] },
      { down: 1, front: 'left', left: [[42, 54], [43, 66], [50, 69]], right: [[37, 52], [29, 62], [34, 67]] },
      { down: 0, front: 'left', left: [[36, 54], [37, 66], [44, 69]], right: [[47, 50], [35, 59], [42, 62]] },
      { down: 0, front: 'right', left: [[32, 53], [30, 64], [36, 69]], right: [[47, 50], [47, 62], [54, 65]] },
      { down: 0, front: 'right', left: [[31, 52], [26, 65], [33, 69]], right: [[46, 53], [50, 66], [57, 69]] },
      { down: 1, front: 'right', left: [[34, 51], [27, 62], [34, 67]], right: [[44, 54], [44, 66], [51, 69]] },
      { down: 0, front: 'right', left: [[42, 50], [31, 59], [38, 62]], right: [[40, 54], [38, 66], [45, 69]] },
      { down: 0, front: 'left', left: [[43, 50], [45, 62], [52, 65]], right: [[35, 53], [31, 64], [38, 69]] },
    ]
    const palette = (x, y) => {
      const i = (y * width + x) * 4
      return `rgb(${original.data[i]}, ${original.data[i + 1]}, ${original.data[i + 2]})`
    }
    const ink = palette(28, 48)
    const cloth = palette(32, 47)
    const light = palette(31, 45)
    const shade = palette(35, 49)
    const leather = palette(31, 60)
    const leatherLight = palette(32, 57)
    const sole = palette(30, 68)

    // Integer scanlines avoid antialiasing and keep the original limited palette.
    const polygon = (points, color) => {
      ctx.fillStyle = color
      const top = Math.floor(Math.min(...points.map(p => p[1])))
      const bottom = Math.ceil(Math.max(...points.map(p => p[1])))
      for (let y = top; y < bottom; y++) {
        const crossings = []
        for (let i = 0; i < points.length; i++) {
          const a = points[i]
          const b = points[(i + 1) % points.length]
          if ((a[1] <= y + .5 && b[1] > y + .5) || (b[1] <= y + .5 && a[1] > y + .5))
            crossings.push(a[0] + (y + .5 - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
        }
        crossings.sort((a, b) => a - b)
        for (let i = 0; i + 1 < crossings.length; i += 2) {
          const left = Math.ceil(crossings[i] - .5)
          const right = Math.ceil(crossings[i + 1] - .5)
          ctx.fillRect(left, y, right - left, 1)
        }
      }
    }
    const segment = (a, b, wa, wb, color) => {
      const length = Math.hypot(b[0] - a[0], b[1] - a[1])
      const nx = -(b[1] - a[1]) / length
      const ny = (b[0] - a[0]) / length
      polygon([
        [a[0] + nx * wa / 2, a[1] + ny * wa / 2],
        [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
        [b[0] - nx * wb / 2, b[1] - ny * wb / 2],
        [a[0] - nx * wa / 2, a[1] - ny * wa / 2],
      ], color)
    }
    const leg = (hip, points, near) => {
      const [knee, ankle, toe] = points
      const cuff = [knee[0] + (ankle[0] - knee[0]) * .22, knee[1] + (ankle[1] - knee[1]) * .22]
      segment(hip, knee, 10, 8, ink)
      segment(knee, cuff, 8, 7, ink)
      segment(hip, knee, 8, 6, near ? cloth : shade)
      segment(knee, cuff, 6, 5, near ? cloth : shade)
      segment([hip[0] - 2, hip[1] + 1], [knee[0] - 1, knee[1]], 2, 2, near ? light : cloth)
      segment(cuff, ankle, 7, 6, ink)
      segment(cuff, ankle, 5, 4, leather)
      segment([cuff[0] - 1, cuff[1] + 1], [ankle[0] - 1, ankle[1]], 1, 1, leatherLight)
      polygon([
        [ankle[0] - 3, ankle[1] - 1], [ankle[0] + 2, ankle[1] - 1],
        [toe[0], toe[1] - 3], [toe[0] + 1, toe[1]],
        [ankle[0] - 4, Math.min(70, ankle[1] + 3)],
      ], sole)
    }
    for (const [frame, pose] of poses.entries()) {
      ctx.save()
      ctx.translate(frame * width, height)
      const leftHip = [33, 40 + pose.down]
      const rightHip = [43, 40 + pose.down]
      if (pose.front === 'left') {
        leg(rightHip, pose.right, false)
        leg(leftHip, pose.left, true)
      } else {
        leg(leftHip, pose.left, false)
        leg(rightHip, pose.right, true)
      }
      // The original artwork covers the waist seam and preserves identity exactly.
      ctx.drawImage(image, 0, 0, width, 41, 0, pose.down, width, 41)
      ctx.restore()
    }
    const walkFrames = poses.map((_, frame) => ctx.getImageData(frame * width, height, width, height).data)
    const distinctWalkFrames = new Set(walkFrames.map(pixels => Array.from(pixels).join(','))).size
    let changedWalkFaces = 0
    for (const [frame, pose] of poses.entries())
      for (let y = 0; y < 32; y++)
        for (let x = 0; x < width; x++) {
          const from = (y * width + x) * 4
          const to = ((y + pose.down) * width + x) * 4
          if (original.data.slice(from, from + 4).some((v, j) => v !== walkFrames[frame][to + j])) changedWalkFaces++
        }
    const first = ctx.getImageData(0, 0, width, height).data
    const second = ctx.getImageData(width, 0, width, height).data
    let changed = 0
    let changedFeet = 0
    let changedFirst = 0
    for (let i = 0; i < first.length; i += 4) {
      if (first.slice(i, i + 4).some((v, j) => v !== original.data[i + j])) changedFirst++
      if (second.slice(i, i + 4).some((v, j) => v !== original.data[i + j])) {
        changed++
        if (i / 4 >= width * 58) changedFeet++
      }
    }
    return { png: canvas.toDataURL('image/png').split(',')[1], width, height, changed, changedFeet, changedFirst, distinctWalkFrames, changedWalkFaces }
  }, `data:image/gif;base64,${readFileSync(source).toString('base64')}`)
  assert.equal(result.width, 66)
  assert.equal(result.height, 72)
  assert.equal(result.changedFirst, 0, 'the first frame must be identical to the original')
  assert.equal(result.changedFeet, 0, 'the feet must remain identical and anchored')
  assert.ok(result.changed > 0, 'the second frame must contain a different pose')
  assert.equal(result.distinctWalkFrames, 8, 'walking needs eight distinct drawn poses')
  assert.equal(result.changedWalkFaces, 0, 'walking must preserve the original face, arms and weapons')
  writeFileSync(destination, Buffer.from(result.png, 'base64'))
  console.log(`Saved ${destination}; idle preserved; eight articulated walk poses drawn with the original palette.`)
} finally {
  await browser.close()
}
