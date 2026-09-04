import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // 保留 import.meta.url，便于运行时解析 assets/
  esbuildOptions(options) {
    options.platform = 'browser';
  },
});
