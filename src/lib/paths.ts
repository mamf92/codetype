import type { WeakKeyMode } from '@/engine/practice/weakKeys'

/** The Basics page's routes, in one place so a link can't drift from its route. */

export const BASICS_PATH = '/basics'

/** Weak-key practice: the ranked set by default, or a chosen few keys. */
export const weakKeyPath = (mode: WeakKeyMode, keys?: string[]): string =>
  keys === undefined || keys.length === 0
    ? `/basics/weak/${mode}`
    : `/basics/weak/${mode}?keys=${encodeURIComponent(keys.join(''))}`

export const keyStagePath = (trackId: string, stageId: string): string =>
  `/basics/keys/${trackId}/${stageId}`

export const KEYFALL_PATH = '/basics/keyfall'
