import { isDev } from '/config.js'
import { createEffectHandler } from '../runtime/optionalEffect.js'

/** Apply the application's mode to optional sound and cosmetic effects. */
const handler = createEffectHandler(isDev)
export const failOptionalEffect = handler.fail
export default handler.run
