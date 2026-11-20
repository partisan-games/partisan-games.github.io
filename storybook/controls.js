/**
 * Controls for a block's settings: the plain objects its module exports whose fields are numbers, yes/no values or
 * such objects, like `rifle` in Rifleman.js. A changed field changes the exported object itself, so the block made
 * next reads it; every object keeps its first values to go back to.
 */

const isLeaf = value => typeof value === 'number' || typeof value === 'boolean'

const isSettings = value => value?.constructor === Object && Object.keys(value).length > 0
  && Object.values(value).every(field => isLeaf(field) || isSettings(field))

/** Each settings object as it was first seen. */
const initial = new Map()

/** The settings objects `module` exports, as `[name, object]`. */
export function settingsOf(module) {
  const found = Object.entries(module).filter(([, value]) => isSettings(value))
  for (const [, settings] of found) if (!initial.has(settings)) initial.set(settings, structuredClone(settings))
  return found
}

const assignDeep = (target, source) => {
  for (const [key, value] of Object.entries(source))
    if (isLeaf(value)) target[key] = value
    else assignDeep(target[key], value)
}

/** Gives every settings object seen its first values back. */
export function restore() {
  for (const [settings, values] of initial) assignDeep(settings, values)
}

/** Sets the field at `path` (`name.field`, or deeper) of `module`'s settings to `value`. */
export function change(module, path, value) {
  const [name, ...fields] = path.split('.')
  const field = fields.pop()
  fields.reduce((object, key) => object[key], module[name])[field] = value
}

/** A number's slider runs from 0 to four times its first value, or to 1 for a first 0. */
const sliderMax = first => first > 0 ? first * 4 : 1
/** A number as a control shows it. */
export const formatValue = value => String(Number(value.toPrecision(3)))

function fieldsHtml(object, first, path) {
  return Object.entries(object).map(([key, value]) => {
    const at = `${path}.${key}`
    if (typeof value === 'boolean')
      return `<label class="storybook-setting"><input type="checkbox" data-setting="${at}" ${value ? 'checked' : ''}> ${key}</label>`
    if (typeof value === 'number') {
      const max = sliderMax(first[key])
      return /* html */`
        <label class="storybook-setting">${key} <output>${formatValue(value)}</output>
          <input type="range" data-setting="${at}" min="0" max="${max}" step="${max / 100}" value="${value}">
        </label>`
    }
    return `<fieldset><legend>${key}</legend>${fieldsHtml(value, first[key], at)}</fieldset>`
  }).join('')
}

/** The controls for `module`'s settings, one group for each object, or nothing when it has none. */
export function controlsHtml(module) {
  const found = settingsOf(module)
  if (!found.length) return ''
  return /* html */`
    <fieldset>
      <legend>Podešavanja</legend>
      ${found.map(([name, settings]) => /* html */`
        <fieldset><legend>${name}</legend>${fieldsHtml(settings, initial.get(settings), name)}</fieldset>`).join('')}
      <button data-restore>Vrati</button>
    </fieldset>`
}

/** The value an input of the controls holds. */
export const inputValue = input => input.type === 'checkbox' ? input.checked : Number(input.value)
