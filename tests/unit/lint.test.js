import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ESLint } from 'eslint'

const eslint = new ESLint()

/** Lints code as if it were a game file, and returns the timer rule messages. */
async function timerProblems(code, filePath = 'scenes/example/Main.js') {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.filter(message => message.ruleId === 'no-restricted-syntax')
}

test('a timer scheduled inside update() is reported', async() => {
  const problems = await timerProblems(`
export default class Game {
  update() {
    if (this.player.dead) setTimeout(() => this.defeat(), 2500)
  }
}
`)
  assert.equal(problems.length, 1)
  assert.equal(problems[0].severity, 2)
  assert.match(problems[0].message, /each frame/)
})

test('a browser timer outside update() is reported, pointing to the game clock', async() => {
  const problems = await timerProblems(`
export default class Game {
  enterAttack() {
    setTimeout(() => this.hit(), 200)
  }
}
`)
  assert.equal(problems.length, 1)
  assert.match(problems[0].message, /after\(\) of the session scopes/)
})

test('a delayed action on the game clock is allowed', async() => {
  const problems = await timerProblems(`
export default class Game {
  enterAttack() {
    this.session.gameplay.after(.2, () => this.hit())
  }
}
`)
  assert.deepEqual(problems, [])
})

test('an interval in game code is reported', async() => {
  for (const code of ['setInterval(() => {}, 3000)', 'window.setInterval(() => {}, 3000)']) {
    const problems = await timerProblems(code, 'core3d/example.js')
    assert.equal(problems.length, 1, code)
    assert.match(problems[0].message, /pause/)
  }
})

test('the timer rules do not apply to tests', async() => {
  assert.deepEqual(await timerProblems('setInterval(() => {}, 3000)', 'tests/unit/example.test.js'), [])
})

test('wall-clock time in game code is reported', async() => {
  for (const code of ['const start = Date.now()', 'const start = performance.now()', 'const today = new Date()']) {
    const problems = await timerProblems(code, 'core/example.js')
    assert.equal(problems.length, 1, code)
    assert.match(problems[0].message, /Wall-clock/)
  }
})

/** Lints code as if it were a file of the shared rules, and returns the import boundary messages. */
async function importProblems(code, filePath = 'core/gameplay/Example.js') {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.filter(message => message.ruleId === 'no-restricted-imports')
}

test('the shared rules and runtime may import each other but not games, the page or rendering', async() => {
  assert.deepEqual(await importProblems('import GameClock from \'../runtime/GameClock.js\''), [])
  for (const source of ['/scenes/vis/Main.js', '/ui/UI.js', '/core/io/sound.js', 'three'])
    assert.equal((await importProblems(`import x from '${source}'`, 'core/runtime/Example.js')).length, 1, source)
  assert.deepEqual(await importProblems('import x from \'/ui/UI.js\'', 'core/actor/Example.js'), [], 'other folders are not bound')
})
