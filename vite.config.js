import url from 'url'
import {defineConfig} from 'vite'
import postcssNesting from 'postcss-nested'
// import postcssMixins from 'postcss-mixins'

export default defineConfig({
  resolve: {
    alias: {
      '@': url.fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    postcss: {
      plugins: [
        postcssNesting,
      ],
    },
  },
})
