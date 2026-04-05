import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  },
  plugins: [crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        popup: 'popup.html'
      }
    }
  }
});
