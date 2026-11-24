export default function showBattlePreview(preview) {
  const canvas = preview.querySelector('canvas')
  const button = preview.querySelector('button')
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const events = new AbortController()
  const options = { signal: events.signal }
  let paused = reducedMotion.matches
  let visible = false
  let view, loading, request, previous
  let elapsed = .4

  function resize() {
    const width = Math.min(1280, Math.round(preview.clientWidth * Math.min(devicePixelRatio, 2)))
    if (!width || width === canvas.width) return

    canvas.width = width
    canvas.height = Math.round(width * 9 / 16)
    view?.render(elapsed)
  }

  function frame(timestamp) {
    if (previous !== undefined) elapsed += (timestamp - previous) / 1000
    previous = timestamp
    view.render(elapsed)
    request = requestAnimationFrame(frame)
  }

  function update() {
    button.textContent = paused ? 'Play animation' : 'Pause animation'
    if (!visible || paused || document.hidden || !preview.isConnected || location.hash) {
      cancelAnimationFrame(request)
      request = previous = undefined
      return
    }

    if (view) {
      if (request === undefined) request = requestAnimationFrame(frame)
      return
    }

    loading ??= import('./BattleView.js').then(async({ default: BattleView }) => {
      const presentation = new BattleView(canvas)
      await presentation.init()
      if (events.signal.aborted) return

      view = presentation
      resize()
      view.render(elapsed)
      canvas.hidden = false
      update()
    }).catch(() => {
      button.hidden = true
    })
  }

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    update()
  })
  const size = new ResizeObserver(resize)
  intersection.observe(preview)
  size.observe(preview)
  button.hidden = false
  button.addEventListener('click', () => {
    paused = !paused
    update()
  }, options)
  reducedMotion.addEventListener('change', event => {
    paused = event.matches
    update()
  }, options)
  document.addEventListener('visibilitychange', update, options)
  window.addEventListener('hashchange', () => {
    visible = false
    update()
    intersection.disconnect()
    size.disconnect()
    events.abort()
  }, { once: true })
  update()
}
