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
  assert.match(problems[0].message, /after\(\) from \/core\/timers\.js/)
})

test('a delayed action on the game clock is allowed', async() => {
  const problems = await timerProblems(`
import { after } from '/core/timers.js'
export default class Game {
  enterAttack() {
    after(.2, () => this.hit())
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
