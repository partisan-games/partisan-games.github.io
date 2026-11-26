import { modelStatistics } from '/core/gameplay/modelStatistics.js'

const body = { file: 'aircraft/messerschmitt-bf-109/model.glb', scale: 1 }

/** What to load; the game awaits requestModels(models) before it creates the plane. */
export const models = [body]

/** How it looks, for a warplane made of a body and its model, and what it really was. */
export const description = { model: body, propellerNames: ['Propeller'], physical: modelStatistics['bf-109'] }
