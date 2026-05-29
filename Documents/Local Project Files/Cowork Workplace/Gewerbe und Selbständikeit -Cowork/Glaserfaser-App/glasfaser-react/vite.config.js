import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Einzelne HTML-Datei für Offline-Nutzung auf dem iPad
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Alle Assets inline → offline nutzbar ohne Server
        inlineDynamicImports: true,
      },
    },
  },
});
