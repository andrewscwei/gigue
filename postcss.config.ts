/* eslint-disable @typescript-eslint/naming-convention */

import postcssIsPseudoClass from '@csstools/postcss-is-pseudo-class'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import fs from 'fs'
import path from 'path'
import postcss, { AtRule, Node, Plugin } from 'postcss'
import postcssCustomMedia from 'postcss-custom-media'
import postcssCustomProperties from 'postcss-custom-properties'
import postcssImport from 'postcss-import'
import postcssNesting from 'postcss-nesting'
import { sprintf } from 'sprintf-js'

const customMediaQueries = fs.readFileSync(path.join(__dirname, 'lib/media.css'), 'utf-8')

const CUSTOM_MEDIA: Record<string, string[]> = {
  '(hover: hover)': ['[class~=\'hover:%s\']:hover %s'],
  ...postcss.parse(customMediaQueries).nodes.reduce((out, curr) => {
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
  }, {}),
}

const customPlugin = (): Plugin => {
  const nodesToAppend: Node[] = []

  return {
    postcssPlugin: 'gigue',
    Rule(rule) {
      const selector = rule.selector

      for (const media in CUSTOM_MEDIA) {
        if (!Object.prototype.hasOwnProperty.call(CUSTOM_MEDIA, media)) continue

        let className: string | undefined
        let subselector: string | undefined

        if (selector.startsWith('.')) {
          const matches = /^\.(.*) ?(.*)$/.exec(selector)
          className = matches?.[1]
          subselector = matches?.[2]
        }
        else if (selector.startsWith('[class~=')) {
          const matches = /^\[class~=('|")(.*)('|")\] ?(.*)$/.exec(selector)
          className = matches?.[2]
          subselector = matches?.[4]
        }

        if (!className) break

        const newRule = rule.clone()
        const newSelector = `${CUSTOM_MEDIA[media].map(t => sprintf(t, className, subselector)).join(', ')}`
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

export default function(ctx: any) {
  return {
    plugins: [
      postcssImport(),
      customPlugin(),
      postcssCustomProperties(),
      postcssIsPseudoClass(),
      postcssCustomMedia(),
      postcssNesting(),
      autoprefixer(),
      ...ctx.env === 'production' ? [cssnano()] : [],
    ],
  }
}
