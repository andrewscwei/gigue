/* eslint-disable @typescript-eslint/naming-convention */

import { Declaration, Node, Plugin, Rule } from 'postcss'
import { sprintf } from 'sprintf-js'
import parseSelector from './utils/parseSelector'

const DICT: string[] = [
  '[class~=\'before:%s\']::before %s',
  '[class~=\'after:%s\']::after %s',
]

const plugin = (): Plugin => {
  const nodesToAppend: Node[] = []

  return {
    postcssPlugin: 'pseudoClasses',
    Rule(rule) {
      const selector = rule.selector

      for (const pseudoClass of DICT) {
        const { className, subselector } = parseSelector(selector)

        if (!className) break

        const newRule = rule.clone()
        const newSelector = sprintf(pseudoClass, className, subselector)
        newRule.selector = newSelector

        nodesToAppend.push(newRule)
      }
    },
    OnceExit(root) {
      for (const node of nodesToAppend) {
        root.append(node)
      }

      const beforeRule = new Rule({ selector: '[class*="before:"]::before' })
      beforeRule.append(new Declaration({ prop: 'content', value: '""' }))

      const afterRule = new Rule({ selector: '[class*="after:"]::after' })
      afterRule.append(new Declaration({ prop: 'content', value: '""' }))

      root.append(beforeRule)
      root.append(afterRule)
    },
  }
}

export default plugin
