/* eslint-disable @typescript-eslint/naming-convention */

import fs from 'fs'
import path from 'path'
import postcss, { AtRule, Node, Plugin, Root } from 'postcss'
import { sprintf } from 'sprintf-js'
import parseSelector from './utils/parseSelector'

const CUSTOM_MEDIA_QUERIES = fs.readFileSync(path.join(__dirname, '../lib/media.css'), 'utf-8')

const DICT: Record<string, string[]> = {
  ['[class~=\'hover:%s\']:hover %s']: ['(hover: hover)'],
  ...mapCustomMediaToDict(postcss.parse(CUSTOM_MEDIA_QUERIES)),
}

function mapCustomMediaToDict(root: Root): Record<string, string[]> {
  return root.nodes.reduce((out, curr) => {
    if (curr.type !== 'atrule' || curr.name !== 'custom-media') return out

    const matches = /^--([^\s]+) (.*)$/.exec(curr.params)
    const name = matches?.[1]
    const query = matches?.[2]

    if (!name || !query) return out

    const isOrientation = name === 'portrait' || name === 'landscape'

    return {
      ...out,
      [`[class~='${name}:%s'] %s`]: [query],
      ...isOrientation ? {} : {
        [`[class~='${name}:portrait:%s'] %s`]: [query, '(orientation: portrait)'],
        [`[class~='${name}:landscape:%s'] %s`]: [query, '(orientation: landscape)'],
      },
    }
  }, {})
}

const plugin = (): Plugin => {
  const nodesToAppend: Node[] = []

  return {
    postcssPlugin: 'mediaClasses',
    Rule(rule) {
      const selector = rule.selector
      const { className, subselector } = parseSelector(selector)

      if (!className) return

      for (const mediaClass in DICT) {
        if (!Object.prototype.hasOwnProperty.call(DICT, mediaClass)) continue

        const mediaQueries = [...DICT[mediaClass]]

        const newRule = rule.clone()
        const newSelector = sprintf(mediaClass, className, subselector)
        newRule.selector = newSelector

        let firstAtRule: AtRule | undefined
        let lastAtRule: AtRule | undefined

        while (mediaQueries.length > 0) {
          const t = new AtRule({ name: 'media', params: mediaQueries.pop() })

          if (!firstAtRule) firstAtRule = t
          lastAtRule?.append(t)
          lastAtRule = t
        }

        lastAtRule?.append(newRule)

        if (firstAtRule) nodesToAppend.push(firstAtRule)
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
