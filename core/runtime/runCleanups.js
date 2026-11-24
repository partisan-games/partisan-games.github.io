/** Finish every independent cleanup before reporting failures; preserve a lone error's identity. */
export default function runCleanups(cleanups) {
  const errors = []
  for (const cleanup of cleanups)
    try {
      cleanup()
    } catch (error) {
      errors.push(error)
    }
  if (errors.length === 1) throw errors[0]
  if (errors.length) throw new AggregateError(errors, 'Several cleanups failed')
}
