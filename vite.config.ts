import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// three.js / R3F only load with the lazy 3D world chunk, so a #/desktop deep
// link never downloads them. The 3D vendor chunk is large by nature.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
});
