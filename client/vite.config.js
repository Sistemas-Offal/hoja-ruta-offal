import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El backend corre en :3007. En dev, /api y /health van hacia allá.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    proxy: {
      '/api': 'http://localhost:3007',
      '/health': 'http://localhost:3007',
    },
  },
});
