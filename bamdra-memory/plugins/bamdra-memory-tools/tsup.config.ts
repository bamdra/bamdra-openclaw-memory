import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  clean: true,
  bundle: true,
  shims: true,
  target: 'node22', // 👈 强制锁定
  splitting: false,
  noExternal: [/.*/],
  external: [
    'node:sqlite',
    'node:fs',
    'node:path',
    'node:url',
    'node:events',
    'node:fs/promises'
  ],
  outExtension() {
    return { js: '.js' };
  },
});