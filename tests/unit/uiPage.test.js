import { test } from 'node:test'
import assert from 'node:assert/strict'

test('the UI page draws every window and HUD element in each theme, with every icon, and tokens on paid buttons', async() => {
  // only what pages/ui.html has: no game canvas, which the games' own modules look up as they load
  document.body.innerHTML = ''
  const { default: renderPreview } = await import('/pages/ui.js')
  const { styleClasses } = await import('/ui/styles.js')
  const { icons } = await import('/core/io/icons.js')
  const root = document.createElement('main')
  document.body.append(root)
  const showTokens = renderPreview(root)

  const [windows, hud] = root.querySelectorAll('table')
  const themes = Object.keys(styleClasses).length
  for (const table of [windows, hud])
    for (const row of table.querySelectorAll('tbody tr')) assert.equal(row.querySelectorAll('td').length, themes, row.textContent)
  assert.equal(windows.querySelectorAll('.central-screen').length, windows.querySelectorAll('tbody tr').length * themes)
  assert.ok(root.querySelector('.report'), 'the start window has its briefing')
  assert.equal(root.querySelectorAll('.joystick-btn').length, 4)
  assert.ok(root.querySelector('.arcade-wallet'))
  const shown = [...root.querySelectorAll('.preview-icon')].map(cell => cell.innerHTML)
  assert.deepEqual(shown, Object.values(icons))

  showTokens(false)
  const paid = [...windows.querySelectorAll('.paid')]
  assert.ok(paid.length > 0)
  assert.ok(paid.every(element => (element.matches('button, input') ? element : element.querySelector('button, input')).disabled))
  showTokens(true)
  assert.ok(windows.querySelectorAll('.price').length > 0)
  assert.ok(paid.every(element => !(element.matches('button, input') ? element : element.querySelector('button, input')).disabled))
})
