/** A sprint's time: hundredths matter when the whole run takes three seconds. */
export const sprintTime = (ms: number): string => `${(ms / 1000).toFixed(2)}s`

/** A countdown or a timed test's length, as a clock reads it: `1:05`. */
export const clockTime = (ms: number): string => {
  const total = Math.ceil(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
