/**
 * Textures that model files reference but the repository does not contain. The models render without them,
 * so they do not fail the smoke test; fixing them needs the original textures or re-exported models.
 */
export const missingModelTextures = [
  '/assets/models/aircraft/airplane/heinkel-he-111/default-grey.jpg',
  '/assets/models/aircraft/airship/aerial-screw/Wood_Cherry_Original_1_12_baseColor.jpeg',
  '/assets/models/building/', // building/bunker.fbx points to a texture with an empty name
  '/assets/models/building/factory/default-grey.jpg',
  '/assets/models/space/arcology-ring/5016_1_baseColor.jpeg',
]
