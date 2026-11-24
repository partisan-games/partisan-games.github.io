const number = (value, digits = 0) => value.toLocaleString('sr-Latn', { maximumFractionDigits: digits })

const mass = kg => kg >= 1000 ? `${number(kg / 1000, 1)} t` : `${number(kg)} kg`

/**
 * The block's stats, read from its body: the health it plays with first, under its health bar, then mass, top speed
 * and armament from the shared model statistics, and its bombs; a value the body does not have is left out.
 */
export function blockStats({ health, performance, physical }) {
  const rows = [
    ['Zdravlje', health?.maximum && number(health.maximum, 1)],
    ['Masa', physical?.massKg && mass(physical.massKg)],
    ['Brzina', physical?.speedKmh && `${number(physical.speedKmh, 1)} km/h`],
    ['Naoružanje', physical?.armament],
    ['Bombe', performance?.bombs && number(performance.bombs)],
  ].filter(([, value]) => value)
  if (!rows.length) return ''
  return /* html */`
    <dl class="catalog-stats">
      ${rows.map(([name, value]) => `<dt>${name}</dt><dd>${value}</dd>`).join('')}
    </dl>`
}
