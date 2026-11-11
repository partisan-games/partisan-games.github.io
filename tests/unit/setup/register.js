import { register } from 'node:module'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register({ url: 'http://localhost/' })

// happy-dom lacks screen orientation, which core/io/platno.js and core/Scena3D.js listen to
if (!screen.orientation)
  Object.defineProperty(screen, 'orientation', { value: new EventTarget() })

register('./resolve.js', import.meta.url)
