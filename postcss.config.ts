/// <reference path='global.d.ts' />

import postcssIsPseudoClass from '@csstools/postcss-is-pseudo-class'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import fs from 'fs'
import path from 'path'
import postcss, { AtRule, Node, Plugin } from 'postcss'
import postcssCustomMedia from 'postcss-custom-media'
import postcssCustomProperties from 'postcss-custom-properties'
import postcssImport from 'postcss-import'
import postcssImportExtGlob from 'postcss-import-ext-glob'
import postcssNesting from 'postcss-nesting'
import { sprintf } from 'sprintf-js'

const customMediaQueries = fs.readFileSync(path.join(__dirname, 'lib/media.css'), 'utf-8')

const CUSTOM_MEDIA: Record<string, string[]> = {
  '(hover: hover)': [`[class~='hover:%s']:hover`],
  ...postcss.parse(customMediaQueries).nodes.reduce((out, curr) => {
    if (curr.type !== 'atrule' || curr.name !== 'custom-media') return out

    const matches = /^--([^\s]+) (.*)$/.exec(curr.params)
    const name = matches?.[1]
    const query = matches?.[2]

    if (!name || !query) return out

    return { ...out, [query]: [
      `[class~='${name}:%s']`,
    ] }
  }, {})
}

const customPlugin = (): Plugin => {
  const nodesToAppend: Node[] = []

  return {
    postcssPlugin: 'gigue',
    Rule(rule) {
      const selector = rule.selector

      for (const media in CUSTOM_MEDIA) {
        let className: string | undefined

        if (selector.startsWith('.')) {
          className = selector.substring(1)
        }
        else if (selector.startsWith('[class')) {
          className = /^.*('|")(.*)('|").*$/.exec(selector)?.[2]
        }

        if (!className) break

        const newRule = rule.clone()
        newRule.selector =`${CUSTOM_MEDIA[media].map(t => sprintf(t, className)).join(', ')}`

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
      postcssImportExtGlob(),
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
