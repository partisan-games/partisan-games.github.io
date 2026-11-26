import { description as partisan } from './PartisanLowpoly.js'

const model = { ...partisan.model, file: 'cetnik.fbx' }

export const models = [model, partisan.twoHandedWeapon]
export const description = { ...partisan, model }
