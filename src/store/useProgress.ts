import { useSyncExternalStore } from 'react'
import type { LanguageId } from '@/content/schema'
import { appendSession, beginProbation, readProgress, writeProgress } from './progress'
import type { ProgressDocument, SessionRecord } from './progress'

/**
 * A single module-level document, published through `useSyncExternalStore` so
 * every screen sees the same history without a provider in the tree.
 */
let document_: ProgressDocument = readProgress()
const listeners = new Set<() => void>()

function commit(next: ProgressDocument): void {
  document_ = next
  writeProgress(next)
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const snapshot = (): ProgressDocument => document_

export const useProgress = (): ProgressDocument =>
  useSyncExternalStore(subscribe, snapshot, snapshot)

export const recordSession = (record: SessionRecord): void =>
  commit(appendSession(document_, record))

export const setFavouriteLanguages = (languages: LanguageId[]): void =>
  commit({ ...document_, favouriteLanguages: languages })

/** Used by the settings affordance on Statistics. */
export const clearHistory = (): void => commit({ ...document_, sessions: [] })

/** Call once a key has passed all five practice levels — puts it on probation. */
export const startKeyProbation = (char: string): void =>
  commit(beginProbation(document_, char, Date.now()))
