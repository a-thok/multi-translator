import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import svelte from 'rollup-plugin-svelte';
import nodeResolve from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';

import pkg from './package.json';

function metablock() {
  const entries = Object.entries(pkg.userscript).map(([key, value]) => `// @${key}    ${value}`);
  return (`// ==UserScript==\n${entries.join('\n')}\n// ==/UserScript==\n`);
}

export default {
  input: 'src/index.ts',

  output: {
    format: 'iife',
    file: 'dist/index.user.js',
    banner: metablock(),
    sourcemap: true,
  },

  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      emitCss: false,
    }),

    nodeResolve({
      browser: true,
      dedupe: ['svelte'],
    }),

    typescript({
      sourceMap: true,
    }),

    serve({
      open: true,
      contentBase: 'dist',
    }),
  ],
};
