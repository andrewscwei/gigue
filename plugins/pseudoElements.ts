/* eslint-disable @typescript-eslint/naming-convention */

import { type Node, type Plugin } from 'postcss'
import { sprintf } from 'sprintf-js'
import parseSelector from './utils/parseSelector'

const DICT: string[] = [
  '.focus\\:%s:focus%s %s',
]

const plugin = (): Plugin => {
  const nodesToAppend: Node[] = []

  return {
    postcssPlugin: 'pseudoElements',
    Rule(rule) {
      const selector = rule.selector

      for (const pseudoClass of DICT) {
        const { className, subselector, pseudo } = parseSelector(selector)

        if (!className) break

        const newRule = rule.clone()
        const newSelector = sprintf(pseudoClass, className, pseudo, subselector)
        newRule.selector = newSelector

        nodesToAppend.push(newRule)
      }
    },
    OnceExit(root) {
      for (const node of nodesToAppend) {
        root.append(node)
      }
    },
  }
}

export default plugin
