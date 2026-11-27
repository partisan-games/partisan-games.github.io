import Arcade from './Arcade.js'

/**
 * The cabinets and the pocket of tokens of the home page. The page loads this small module on its own, ahead of the
 * games, so the pocket shows as soon as the page is read; the router takes the same one.
 */
export const arcade = new Arcade()

// the development pages and trial levels show only on the local server
if (arcade.isLocal) for (const hidden of document.querySelectorAll('.dev-links, [data-dev]')) hidden.removeAttribute('hidden')
