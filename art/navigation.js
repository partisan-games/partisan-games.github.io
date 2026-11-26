const normalize = value => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Shows only the folders of the `tree` whose path holds every word of `search`, with the folders above them opened,
 * and `none` when nothing is left; an emptied search opens the folders again as they were before it.
 */
export function searchTree(search, tree, none) {
  let before = null
  search.addEventListener('input', () => {
    const words = normalize(search.value).trim().split(/\s+/).filter(Boolean)
    const entries = [...tree.querySelectorAll('li')], groups = [...tree.querySelectorAll('details')]
    if (words.length && !before) before = new Map(groups.map(group => [group, group.open]))
    const matches = entry => words.every(word => normalize(entry.dataset.path).includes(word))
    for (const entry of entries)
      entry.hidden = !matches(entry) && ![...entry.querySelectorAll('li')].some(matches)
    for (const group of groups)
      group.open = words.length ? !group.parentElement.hidden : before?.get(group) ?? group.open
    if (!words.length) before = null
    none.hidden = entries.some(entry => !entry.hidden)
  })
}

async function copyPath(path) {
  if (navigator.clipboard?.writeText)
    try {
      await navigator.clipboard.writeText(path)
      return
    } catch {
      // Local HTTP previews may lack clipboard permission; try copying from a selected field.
    }
  const previous = document.activeElement
  const field = document.createElement('textarea')
  field.className = 'clipboard-field'
  field.value = path
  field.readOnly = true
  document.body.append(field)
  field.select()
  field.setSelectionRange(0, path.length)
  try {
    if (!document.execCommand('copy')) throw new Error('Copy failed')
  } finally {
    field.remove()
    previous?.focus({ preventScroll: true })
  }
}

/** A click on a file's name in `gallery` copies its path in the project and says whether that worked. */
export function copyNames(gallery) {
  gallery.addEventListener('click', async event => {
    const button = event.target.closest('[data-copy-path]')
    if (!button || button.disabled) return
    const status = button.parentElement.querySelector('[data-copy-status]')
    button.disabled = true
    status.textContent = ''
    try {
      await copyPath(button.dataset.copyPath)
      status.textContent = '· Kopirano'
    } catch {
      status.textContent = '· Kopiranje nije uspelo'
    } finally {
      button.disabled = false
    }
  })
}
