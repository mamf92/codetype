import type { LanguageId, Track } from './schema'
import { typescriptCore, typescriptFrontier } from './tracks/typescript'
import { reactCore, reactFrontier } from './tracks/react'
import { tailwindCore, tailwindV4 } from './tracks/tailwind'

/**
 * The catalogue. Order matters only as a tiebreak — every surface sorts by
 * something meaningful (recency, language, progress) before it renders.
 */
export const TRACKS: Track[] = [
  typescriptCore,
  typescriptFrontier,
  reactCore,
  reactFrontier,
  tailwindCore,
  tailwindV4,
]

export const trackById = (id: string): Track | undefined => TRACKS.find((track) => track.id === id)

export const dispatches = (): Track[] =>
  TRACKS.filter((track) => track.kind === 'dispatch').sort((a, b) =>
    (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''),
  )

export const courses = (): Track[] => TRACKS.filter((track) => track.kind === 'course')

export const languagesInCatalogue = (): LanguageId[] => [
  ...new Set(TRACKS.map((track) => track.language)),
]

export interface DrillLocation {
  track: Track
  lesson: Track['lessons'][number]
  drill: Track['lessons'][number]['drills'][number]
  /** Position of this drill within the whole track, and the track's total. */
  position: number
  total: number
}

/** Flatten a track into the order the drill screen walks through it. */
export function drillSequence(track: Track): DrillLocation[] {
  const flat = track.lessons.flatMap((lesson) =>
    lesson.drills.map((drill) => ({ track, lesson, drill })),
  )
  return flat.map((entry, index) => ({ ...entry, position: index, total: flat.length }))
}

export function locateDrill(trackId: string, drillId: string): DrillLocation | undefined {
  const track = trackById(trackId)
  if (track === undefined) return undefined
  return drillSequence(track).find((entry) => entry.drill.id === drillId)
}
