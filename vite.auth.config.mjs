import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve('auth-src'),
  base: '/db-specialist-study/auth/',
  envDir: resolve('.'),
  build: {
    outDir: resolve('auth'),
    emptyOutDir: true,
    rollupOptions: { input: resolve('auth-src/index.html') },
  },
});
