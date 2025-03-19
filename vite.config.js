import url from 'url'
import {resolve} from 'path'

import {defineConfig} from 'vite'

import postcssNesting from 'postcss-nested'
import cssnanoPlugin from 'cssnano'

export default defineConfig({
  resolve: {
    alias: {
      '@':  url.fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
  },
  css: {
    postcss: {
      plugins: [
        postcssNesting,
        cssnanoPlugin,
      ],
    },
  },
})
