import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const hugeiconsCaseFixPlugin = () => {
  const fixes: Record<string, string> = {
    './Grid2x2CheckIcon.js': './Grid2X2CheckIcon.js',
    './Grid2x2PlusIcon.js': './Grid2X2PlusIcon.js',
    './Grid2x2Icon.js': './Grid2X2Icon.js',
    './Grid2x2XIcon.js': './Grid2X2XIcon.js',
    './Grid3x2Icon.js': './Grid3X2Icon.js',
    './Grid3x3Icon.js': './Grid3X3Icon.js',
  };
  return {
    name: 'hugeicons-case-fix',
    resolveId(source: string, importer?: string) {
      if (importer && importer.includes('@hugeicons/core-free-icons') && fixes[source]) {
        return this.resolve(fixes[source], importer, { skipSelf: true });
      }
      return null;
    },
  };
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), hugeiconsCaseFixPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
    },
  };
});
