import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    // pnpm keeps several peer-hashed copies of these; the kit and the app
    // must share one instance or RouterLink and pinia lose their injections.
    dedupe: ['vue', 'vue-router', 'pinia', 'vee-validate'],
  },
  // Scan every screen up front, so the kit's entries are pre-bundled at start
  // instead of one by one on first visit, each forcing a full page reload.
  optimizeDeps: { entries: ['index.html', 'src/**/*.vue'] },
  server: { port: 5180 },
});
