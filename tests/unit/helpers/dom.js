/** The page elements that modules such as ui/UI.js and core/io/platno.js look up when they load. */
export function createPageElements() {
  document.body.innerHTML = '<main id="ui"></main><canvas id="platno"></canvas><div id="modal"></div>'
  Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true })
}
