import { expect as baseExpect } from '@playwright/test'
import { test, watchProblems, waitForScene, startGame, errorScreen, onScene } from './helpers.js'

// with several heavy 3D games rendering in software at once, one frame can take seconds
const expect = baseExpect.configure({ timeout: 30_000 })

/**
 * Each game that can be won, with the smallest change that puts it just before winning.
 * The other games have no victory at all; they are listed in docs/TESTING.md.
 */
const wins = {
  '3d-tank': scene => {
    scene.countableCrates = []
  },
  avatar: scene => {
    scene.coins = []
  },
  bunker: scene => {
    scene.player.x = scene.bunker.x
    scene.player.y = scene.bunker.y
  },
  cannon: scene => {
    scene.boxes = []
  },
  follow: scene => scene.golems.forEach(golem => {
    golem.followDistance = 1e6
  }),
  'fps-airport': scene => {
    // the game only updates while the mouse is locked, which headless Chromium does not grant
    Object.defineProperty(document, 'pointerLockElement', { get: () => document.body, configurable: true })
    scene.aircraft = []
  },
  'fps-base': scene => {
    scene.player.position = scene.maze.exitPosition
  },
  'franjo-kluz': scene => {
    scene.vozilo.umri()
    scene.vozilo.x = -9999
    scene.player.y = scene.visina
  },
  'graveyard-survival': scene => {
    scene.gameLoop.time = 302_000
  },
  'moon-landing': scene => {
    const { position } = scene.lander.platform
    scene.lander.position = { x: position.x, y: position.y + .5, z: 0 }
  },
  neretva: scene => {
    scene.preostaloVreme = 0
  },
  ranjenik: scene => {
    scene.scena = 1
    scene.player.x = 1e5
  },
  'rpg-fantasy': scene => {
    scene.score = scene.player.enemies.length
  },
  tenkici: scene => {
    scene.tenk2.alive = false
  },
  ustanak: scene => {
    scene.tenk.alive = false
  },
  vis: scene => {
    // every wave has flown but the last, the boss, which comes now and goes down
    const { waves } = scene
    waves.enemies.forEach(enemy => enemy.umri())
    waves.next = waves.schedule.length
    waves.launch(waves.schedule.at(-1))
    waves.boss.damage(waves.boss.hits)
  },
  walls: scene => {
    scene.player.position = scene.maze.exitPosition
  },
  warplane: scene => {
    scene.gameLoop.time = 150_000
  },
}

const victoryTitle = page => page.locator('#modal h3.olive', { hasText: '🎖️' })

for (const [scene, win] of Object.entries(wins))
  test(`scene ${scene} can be won, and the victory stays`, async({ page }) => {
    const problems = watchProblems(page)

    await page.goto(`/#${scene}`)
    await waitForScene(page)
    await startGame(page)
    // games that start with a choice (an avatar, a plane) start only after the choice has loaded
    await expect.poll(() => onScene(page, scene => scene.gameLoop.isRunning)).toBe(true)

    await onScene(page, win)
    await expect(victoryTitle(page)).toBeVisible()
    await expect(page.locator('#modal #igraj-opet')).toBeVisible()

    await page.waitForTimeout(1500)
    await expect(victoryTitle(page), 'a later defeat must not replace the victory').toBeVisible()
    await expect(errorScreen(page)).toHaveCount(0)
    expect(problems).toEqual([])
  })
