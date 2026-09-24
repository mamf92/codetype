import { numberRow } from './numbers'
import { javascriptSymbols } from './javascript'
import { pythonSymbols } from './python'
import { shellSymbols } from './shell'
import type { KeyTrack } from './schema'

/**
 * The key tracks, in the order the Basics page shows them. JavaScript and
 * Python get separate symbol tracks because they spend their punctuation in
 * different places — `=>`, `?.` and `${}` on one side, `:`, `__` and `**`
 * on the other — and the shell spends more of it per line than either.
 */
export const KEY_TRACKS: KeyTrack[] = [numberRow, javascriptSymbols, pythonSymbols, shellSymbols]

export const keyTrackById = (id: string): KeyTrack | undefined =>
  KEY_TRACKS.find((track) => track.id === id)
