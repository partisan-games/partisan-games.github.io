/**
 * Textures that model files reference but the repository does not contain. The models render without them,
 * so they do not fail the smoke test; fixing them needs the original textures or re-exported models.
 */
export const missingModelTextures = [
  '/assets/models/aircraft/airplane/heinkel-he-111/default-grey.jpg',
  '/assets/models/aircraft/airship/aerial-screw/Wood_Cherry_Original_1_12_baseColor.jpeg',
  '/assets/models/building/', // building/bunker.fbx points to a texture with an empty name
  '/assets/models/building/factory/default-grey.jpg',
  '/assets/models/character/soldier/C:/Users/ori.damjanp/Downloads/partisan/color_0.467440-0.467440-0.467440.jpg',
  '/assets/models/space/arcology-ring/5016_1_baseColor.jpeg',
  '/assets/models/weapon/axe-lowpoly/1623429153_20-phonoteka_org-p-tekstura-belogo-metalla-s-tsarapinami-kras-24.jpg',
  '/assets/models/weapon/rifle-berthier/default-grey.jpg',
]
