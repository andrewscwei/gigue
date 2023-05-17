/// <reference path='global.d.ts' />

import postcssIsPseudoClass from '@csstools/postcss-is-pseudo-class'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import postcssImport from 'postcss-import'
import postcssImportExtGlob from 'postcss-import-ext-glob'
import postcssNesting from 'postcss-nesting'
import postcssPrefixSelector from 'postcss-prefix-selector'
import { sprintf } from 'sprintf-js'

const CLASS_PREFIXES = [
  ':is(:not(.touch)) [class~=\'hover:%s\']:hover',
]

export default function(ctx: any) {
  return {
    plugins: [
      postcssImportExtGlob(),
      postcssImport(),
      postcssPrefixSelector({
        transform: ((prefix: string, selector: string, prefixedSelector: string, filePath: string, rule: any) => {
          if (selector.startsWith('.')) {
            const className = selector.substring(1)

            return `${selector}, ${CLASS_PREFIXES.map(t => sprintf(t, className)).join(', ')}`
          }
          else if (selector.startsWith('[class')) {
            const className = /^.*('|")(.*)('|").*$/.exec(selector)?.[2]

            if (!className) return selector

            return `${selector}, ${CLASS_PREFIXES.map(t => sprintf(t, className)).join(', ')}`
          }
          else {
            return selector
          }
        }) as any,
      }),
      postcssIsPseudoClass(),
      postcssNesting(),
      autoprefixer(),
      ...ctx.env === 'production' ? [cssnano()] : [],
    ]
  }
}
