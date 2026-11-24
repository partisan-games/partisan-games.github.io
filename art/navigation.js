const search = document.getElementById('folder-search')
const entries = [...document.querySelectorAll('.tree li')]
const groups = [...document.querySelectorAll('.tree details')].map(element => ({ element, open: element.open }))
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

search.addEventListener('input', () => {
  const words = normalize(search.value).trim().split(/\s+/).filter(Boolean)
  const matches = entry => words.every(word => normalize(entry.dataset.path).includes(word))
  for (const entry of entries)
    entry.hidden = !matches(entry) && ![...entry.querySelectorAll('li')].some(matches)
  for (const { element, open } of groups)
    element.open = words.length ? !element.parentElement.hidden : open
  document.getElementById('no-folders').hidden = entries.some(entry => !entry.hidden)
})

document.querySelector('.tree [aria-current="page"]')?.scrollIntoView?.({ block: 'nearest' })

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

document.querySelector('.gallery')?.addEventListener('click', async event => {
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
