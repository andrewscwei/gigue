/* eslint-disable @typescript-eslint/naming-convention */

import { Declaration, type Node, type Plugin } from 'postcss'
import { sprintf } from 'sprintf-js'
import parseSelector from './utils/parseSelector'

const DICT: string[] = [
  '.before\\:%s::before%s %s',
  '.after\\:%s::after%s %s',
]

const plugin = (): Plugin => {
  const nodesToAppend: Node[] = []

  return {
    postcssPlugin: 'pseudoClasses',
    Rule(rule) {
      const selector = rule.selector

      for (const pseudoClass of DICT) {
        const { className, subselector, pseudo } = parseSelector(selector)

        if (!className) break

        const newRule = rule.clone()
        const newSelector = sprintf(pseudoClass, className, pseudo, subselector)
        newRule.selector = newSelector
        newRule.append(new Declaration({ prop: 'content', value: '""' }))

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
