import { useState } from 'react'

/**
 * The wall clock, read once when the screen mounts.
 *
 * Freshness and "days ago" move on the scale of days, so re-reading the clock
 * on every render would buy nothing and make render impure.
 */
export const useNow = (): number => useState(() => Date.now())[0]
