import Stage2D from './Stage2D.js'

// Flat art can need a 3D stage (billboards); its renderer does not define its art dimension.
export const dimensionOf = story => story.dimension ?? (!story.stage || story.stage === Stage2D ? '2d' : '3d')

export function findStory(kinds, address) {
  const [kindId, storyId, selection] = address.split('/')
  const kind = kinds.find(({ id }) => id === kindId) ?? kinds[0]
  const path = [storyId, selection].filter(Boolean).join('/')
  for (const story of kind.stories) {
    const look = story.looks?.find(look => look.aliases?.includes(path))
    if (look) return { kind, story, look }
    if (story.aliases?.includes(path)) return { kind, story, look: story.looks?.[0] }
  }
  const story = kind.stories.find(({ id }) => id === storyId) ?? kind.stories[0]
  return { kind, story, look: story.looks?.find(({ id }) => id === selection) ?? story.looks?.[0] }
}

const normalize = text => text.toLocaleLowerCase('sr-Latn').normalize('NFD').replace(/\p{Diacritic}/gu, '').replaceAll('đ', 'dj')

export function groupOf(kind, story) {
  if (story.catalogGroup) return story.catalogGroup
  if (kind.id === 'drugi-svetski-rat-3d' || kind.id === 'vojnici') {
    const name = normalize(story.name)
    const army = /italij|italian/.test(name) ? 'Italijani' : /nemac|nemack|nacist|ss vojnik/.test(name) ? 'Nemci'
      : /sovjets/.test(name) ? 'Sovjeti' : /partizan|pokreta otpora/.test(name) ? 'Partizani' : /cetni/.test(name) ? 'Četnici' : 'Ostali'
    return ['Vojnici', army]
  }
  if (kind.id === 'zivotinje-i-masine-3d') return [story.id === 'tenk-3d' ? 'Vozila' : story.id === 'cepelin-3d' ? 'Letelice' : 'Životinje']
  return [{ 'letelice-3d': 'Letelice', 'artiljerija-3d': 'Artiljerija', 'kule-3d': 'Kule sa topom', 'fantazija-3d': 'Fantazija', 'horor-3d': 'Horor' }[kind.id] ?? kind.title]
}

/** Navigation owns its disclosure state; stage resets never rebuild this tree. */
export function createCatalog(root, kinds, storage) {
  const storageKey = 'catalog.groups'
  let preferences = storage
  let saved = {}
  try {
    preferences ??= window.localStorage
    saved = JSON.parse(preferences.getItem(storageKey) ?? '{}') ?? {}
    if (typeof saved !== 'object' || Array.isArray(saved)) saved = {}
  } catch { /* Storage may be disabled. */ }
  const search = document.createElement('input')
  search.type = 'search'
  search.placeholder = 'Pretraži aktere'
  search.setAttribute('aria-label', 'Pretraži aktere')
  const empty = document.createElement('p')
  empty.textContent = 'Nema pronađenih aktera.'
  empty.hidden = true
  const tree = document.createElement('div')
  root.append(search, tree, empty)
  const groups = new Map(), entries = []
  const persist = () => {
    try {
      preferences.setItem(storageKey, JSON.stringify(saved))
    } catch { /* Navigation also works without storage. */ }
  }
  for (const kind of kinds) for (const story of kind.stories) {
    const path = [dimensionOf(story).toUpperCase(), ...groupOf(kind, story)]
    let parent = tree
    const ancestors = []
    path.forEach((title, index) => {
      const key = path.slice(0, index + 1).join('/')
      let group = groups.get(key)
      if (!group) {
        group = document.createElement('details')
        const summary = document.createElement('summary')
        summary.textContent = title
        group.append(summary)
        group.open = saved[key] === true
        group.addEventListener('toggle', () => {
          if (search.value.trim() || group.open === (saved[key] === true)) return
          saved[key] = group.open
          persist()
        })
        parent.append(group)
        groups.set(key, group)
      }
      ancestors.push(group)
      parent = group
    })
    const link = document.createElement('a')
    link.href = `#${kind.id}/${story.id}`
    link.textContent = story.name
    link.setAttribute('aria-current', 'false')
    parent.append(link)
    entries.push({ link, ancestors, text: normalize([...path, story.name, story.game, ...(story.looks ?? []).map(look => look.name)].join(' ')) })
  }
  for (const [key, group] of groups) if (key.endsWith('/Ostali')) group.parentElement.append(group)
  // Only the first two group levels fold, regardless of their contents.
  for (const [key, group] of groups) {
    if (key.split('/').length <= 2) continue
    const section = document.createElement('section')
    const heading = document.createElement('h3')
    heading.textContent = group.firstElementChild.textContent
    section.append(heading, ...[...group.children].slice(1))
    group.replaceWith(section)
    groups.set(key, section)
    for (const entry of entries) entry.ancestors = entry.ancestors.filter(ancestor => ancestor !== group)
  }
  const filter = () => {
    const query = normalize(search.value.trim()).split(/\s+/).filter(Boolean)
    for (const { link, text } of entries) link.hidden = !query.every(word => text.includes(word))
    for (const [key, group] of [...groups].reverse()) {
      group.hidden = ![...group.querySelectorAll('a')].some(link => !link.hidden)
      if (group.tagName === 'DETAILS') group.open = query.length ? !group.hidden : saved[key] === true
    }
    empty.hidden = entries.some(({ link }) => !link.hidden)
  }
  search.addEventListener('input', filter)
  return {
    select(kind, story) {
      const address = `#${kind.id}/${story.id}`
      for (const { link, ancestors } of entries) {
        const selected = link.getAttribute('href') === address
        const changed = selected && link.getAttribute('aria-current') !== 'true'
        link.setAttribute('aria-current', String(selected))
        if (!changed) continue
        for (const group of ancestors) group.open = true
        if (!link.hidden) link.scrollIntoView?.({ block: 'nearest' })
      }
    },
  }
}
