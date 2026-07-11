import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'BACKEND_'], // exposes BACKEND_BASE_URL to client code via import.meta.env
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
