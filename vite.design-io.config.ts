import { defineConfig, mergeConfig } from 'vite';
import mainConfig from './vite.config';
export default defineConfig(env => mergeConfig(typeof mainConfig === 'function' ? mainConfig(env) : mainConfig, {
  publicDir: false,
  build: { outDir: '/tmp/jxl-design-io-build', emptyOutDir: true, rollupOptions: { input: 'design-io.html' } },
}));
