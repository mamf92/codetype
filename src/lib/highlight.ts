import { refractor } from 'refractor/core'
import tsx from 'refractor/tsx'
import typescript from 'refractor/typescript'
import javascript from 'refractor/javascript'
import css from 'refractor/css'
import json from 'refractor/json'
import python from 'refractor/python'
import kotlin from 'refractor/kotlin'
import java from 'refractor/java'
import bash from 'refractor/bash'
import type { Grammar } from '@/content/schema'

for (const language of [tsx, typescript, javascript, css, json, python, kotlin, java, bash]) {
  refractor.register(language)
}

/** Node shapes we care about in refractor's hast output. */
interface TextNode {
  type: 'text'
  value: string
}
interface ElementNode {
  type: 'element'
  properties?: { className?: string[] }
  children: HastNode[]
}
interface RootNode {
  type: 'root'
  children: HastNode[]
}
type HastNode = TextNode | ElementNode | RootNode

/**
 * The most specific Prism scope on a node, e.g. `keyword` from
 * `['token', 'keyword']`. Returns null for the generic `token` wrapper.
 */
function scopeOf(node: ElementNode): string | null {
  const classNames = node.properties?.className ?? []
  const specific = classNames.filter((name) => name !== 'token')
  return specific[0] ?? null
}

/**
 * Highlight `code` and flatten the result to one scope per character, so the
 * typing surface can colour each cell independently of the token tree.
 *
 * The returned array is always exactly `code.length` long; if the grammar
 * fails for any reason every character falls back to `null` (plain text).
 */
export function scopesPerCharacter(code: string, grammar: Grammar): (string | null)[] {
  if (grammar === 'plain') return Array.from({ length: code.length }, () => null)

  let tree: RootNode
  try {
    tree = refractor.highlight(code, grammar) as unknown as RootNode
  } catch {
    return Array.from({ length: code.length }, () => null)
  }

  const scopes: (string | null)[] = []

  const walk = (node: HastNode, inherited: string | null): void => {
    if (node.type === 'text') {
      for (let i = 0; i < node.value.length; i += 1) scopes.push(inherited)
      return
    }
    const scope = node.type === 'element' ? (scopeOf(node) ?? inherited) : inherited
    for (const child of node.children) walk(child, scope)
  }

  walk(tree, null)

  // Defensive: a grammar that drops or duplicates characters must not desync
  // the cells from the source text.
  if (scopes.length !== code.length) {
    return Array.from({ length: code.length }, (_, i) => scopes[i] ?? null)
  }
  return scopes
}
