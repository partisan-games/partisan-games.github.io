/** Separate models that share a factory; old model-selection links remain aliases. */
export function separateModels(story) {
  return story.looks.map((look, index) => {
    const base = { ...story }
    delete base.looks
    delete base.modelNames
    delete base.modelIds
    return { ...base, game: look.game ?? story.game, id: story.modelIds?.[look.id] ?? (index ? `${story.id}-${look.id}` : story.id),
      name: story.modelNames?.[look.id] ?? look.name, aliases: [`${story.id}/${look.id}`, ...(!index ? [story.id] : [])],
      create: (stage, way) => story.create(stage, way, look.value) }
  })
}
