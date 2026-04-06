import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        viewer: 'viewer.html',
        panel: 'panel.html',
        options: 'options.html',
        devtools: 'devtools.html'
      }
    }
  }
});
