/* eslint-disable @typescript-eslint/naming-convention */

import fs from 'fs'
import path from 'path'
import postcss, { AtRule, Node, Plugin, Root } from 'postcss'
import { sprintf } from 'sprintf-js'
import parseSelector from './utils/parseSelector'

const CUSTOM_MEDIA_QUERIES = fs.readFileSync(path.join(__dirname, '../lib/media.css'), 'utf-8')

const DICT: Record<string, string[]> = {
  '(hover: hover)': ['[class~=\'hover:%s\']:hover %s'],
  ...mapCustomMediaToDict(postcss.parse(CUSTOM_MEDIA_QUERIES)),
}

function mapCustomMediaToDict(root: Root): Record<string, string[]> {
  return root.nodes.reduce((out, curr) => {
    if (curr.type !== 'atrule' || curr.name !== 'custom-media') return out

    const matches = /^--([^\s]+) (.*)$/.exec(curr.params)
    const name = matches?.[1]
    const query = matches?.[2]

    if (!name || !query) return out

    return {
      ...out, [query]: [
        `[class~='${name}:%s'] %s`,
      ],
    }
  }, {})
}

const plugin = (): Plugin => {
  const nodesToAppend: Node[] = []

  return {
    postcssPlugin: 'mediaClasses',
    Rule(rule) {
      const selector = rule.selector

      for (const media in DICT) {
        if (!Object.prototype.hasOwnProperty.call(DICT, media)) continue

        const { className, subselector } = parseSelector(selector)

        if (!className) break

        const newRule = rule.clone()
        const newSelector = `${DICT[media].map(t => sprintf(t, className, subselector)).join(', ')}`
        newRule.selector = newSelector

        const newAtRule = new AtRule({ name: 'media', params: media })
        newAtRule.append(newRule)

        nodesToAppend.push(newAtRule)
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
