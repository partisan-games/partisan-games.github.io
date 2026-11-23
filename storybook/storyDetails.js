/** Plain-language preparation and usage limits, visible before the actor's controls. */
export function createStoryDetails(story) {
  const details = document.createElement('div')
  if (story.description) {
    const description = document.createElement('p')
    description.textContent = story.description
    details.append(description)
  }
  if (story.allowedSeasons?.length === 1 && story.allowedSeasons[0] === 'winter') {
    const season = document.createElement('p')
    season.className = 'storybook-season'
    season.textContent = 'Zimska uniforma — samo zima. Ne koristiti u proleće, leto ni jesen.'
    details.append(season)
  }
  return details
}
