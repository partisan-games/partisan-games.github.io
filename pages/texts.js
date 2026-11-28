import { texts } from '/scenes/texts.js'

const escape = value => String(value).replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char])

/** The report before the start and the task, which matter most to the owner, stand out (owner, 2026-11-28). */
const main = ['report', 'intro']

/** A text made while playing shows as its template, what the game fills in marked `${…}`. */
const shown = (value, classes) => {
  if (typeof value !== 'function') return `<dd class="${classes}">${escape(value)}</dd>`
  const template = String(value).match(/`([\s\S]*)`/)?.[1] ?? String(value)
  return `<dd class="template ${classes}">${escape(template)}</dd>`
}

/** Every text of `group`, its nested lists and sets named by their path. */
const entries = (group, path = '') => Object.entries(group).flatMap(([key, value]) => {
  const name = path ? `${path}.${key}` : key
  if (value && typeof value === 'object') return entries(value, name)
  const classes = main.includes(name) ? 'main' : ''
  return [`<dt class="${classes}">${escape(name)}</dt>${shown(value, classes)}`]
})

/** The page names a game by the title of its card on the home page, where it has one. */
const titles = async() => {
  const page = new DOMParser().parseFromString(await (await fetch('/')).text(), 'text/html')
  return new Map([...page.querySelectorAll('.arcade-cabinet[data-path]')]
    .map(card => [card.dataset.path, card.querySelector('h3')?.textContent.trim()]))
}

/** Draws into `root` each game's texts under its title. */
export default async function renderTexts(root) {
  const names = await titles().catch(() => new Map())
  root.innerHTML = Object.entries(texts).map(([game, group]) =>
    `<section><h2>${escape(names.get(game) ?? game)}</h2><dl>${entries(group).join('')}</dl></section>`).join('')
}
