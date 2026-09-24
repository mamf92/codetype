import { describe, expect, it } from 'vitest'
import { isKeyboardKey, isPracticableKey, typedCharacter, type KeyInput } from './keys'

const press = (over: Partial<KeyInput>): KeyInput => ({
  key: 'a',
  code: 'KeyA',
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  altGraph: false,
  altComposes: false,
  ...over,
})

describe('typedCharacter', () => {
  it('types a plain character, shifted or not', () => {
    expect(typedCharacter(press({}))).toBe('a')
    expect(typedCharacter(press({ key: '{', code: 'BracketLeft' }))).toBe('{')
  })

  it('ignores named keys', () => {
    expect(typedCharacter(press({ key: 'Shift', code: 'ShiftLeft' }))).toBeNull()
    expect(typedCharacter(press({ key: 'Tab', code: 'Tab' }))).toBeNull()
  })

  it('treats Meta and bare Ctrl as shortcuts', () => {
    expect(typedCharacter(press({ key: 'c', code: 'KeyC', metaKey: true }))).toBeNull()
    expect(typedCharacter(press({ key: 'c', code: 'KeyC', ctrlKey: true }))).toBeNull()
  })

  it('types a Norwegian bracket behind AltGr on Windows (reported as Ctrl+Alt)', () => {
    const altGr7 = press({ key: '{', code: 'Digit7', ctrlKey: true, altKey: true })
    expect(typedCharacter(altGr7)).toBe('{')
    expect(typedCharacter({ ...altGr7, altGraph: true })).toBe('{')
  })

  it('types a Norwegian bracket behind Option on a Mac (reported as Alt)', () => {
    const option8 = press({ key: '[', code: 'Digit8', altKey: true, altComposes: true })
    expect(typedCharacter(option8)).toBe('[')
  })

  it('treats plain Alt as a shortcut where Alt does not compose characters', () => {
    expect(typedCharacter(press({ key: 'r', code: 'KeyR', altKey: true }))).toBeNull()
    // Windows Alt+Shift+1 reports the shifted character, not a composed one.
    expect(typedCharacter(press({ key: '!', code: 'Digit1', altKey: true }))).toBeNull()
    // A Russian layout's Alt+D (the address bar) reports 'в'.
    expect(typedCharacter(press({ key: 'в', code: 'KeyD', altKey: true }))).toBeNull()
  })

  it('treats Ctrl+Alt that still reports its own letter or digit as a shortcut', () => {
    const ctrlAlt = { altKey: true, ctrlKey: true }
    expect(typedCharacter(press({ key: '1', code: 'Digit1', ...ctrlAlt }))).toBeNull()
    expect(typedCharacter(press({ key: 'R', code: 'KeyR', ...ctrlAlt }))).toBeNull()
  })
})

describe('keyboard and practicable keys', () => {
  it('the line break is never a key; the space is a key but never practiced', () => {
    expect(isKeyboardKey('\n')).toBe(false)
    expect(isKeyboardKey(' ')).toBe(true)
    expect(isPracticableKey(' ')).toBe(false)
    expect(isPracticableKey('[')).toBe(true)
  })
})
