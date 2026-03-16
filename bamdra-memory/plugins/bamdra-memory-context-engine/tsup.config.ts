import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  clean: true,
  bundle: true,
  shims: true,
  // 关键 1: 明确目标环境为 Node 22，这会告诉 esbuild 这是一个现代 Node 环境
  target: 'node22', 
  splitting: false,
  noExternal: [/.*/],
  // 关键 2: 使用数组形式，明确指定这些是外部的原生模块
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
  // 关键 3: 强制 esbuild 保持 node: 前缀 (针对某些版本的特殊处理)
  esbuildOptions(options) {
    options.platform = 'node';
    options.target = 'node22';
  }
});