import postcssIsPseudoClass from '@csstools/postcss-is-pseudo-class'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import postcssCustomMedia from 'postcss-custom-media'
import postcssCustomProperties from 'postcss-custom-properties'
import postcssImport from 'postcss-import'
import postcssNesting from 'postcss-nesting'
import customMedia from './plugins/customMedia'
import pseudoClasses from './plugins/pseudoClasses'
import pseudoElements from './plugins/pseudoElements'

export default function (ctx: any) {
  return {
    plugins: [
      postcssImport(),
      pseudoClasses(),
      pseudoElements(),
      customMedia(),
      postcssCustomProperties(),
      postcssIsPseudoClass(),
      postcssCustomMedia(),
      postcssNesting(),
      autoprefixer(),
      ...ctx.env === 'production' ? [cssnano()] : [],
    ],
  }
}
