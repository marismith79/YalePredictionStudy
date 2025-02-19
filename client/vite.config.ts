import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiUrl = `https://yalepredictionsurvey.azurewebsites.net/`;
// const apiUrl = `http://localhost:3000`;

export default defineConfig({
  plugins: [react()],
  build: {
    target: "ESNEXT",
    outDir: 'dist',
    emptyOutDir: true
  },
  define: {
    define: {
      __VITE_STADIA_API_KEY__: JSON.stringify(process.env.VITE_STADIA_API_KEY),
      __VITE_HUME_API_KEY__: JSON.stringify(process.env.VITE_HUME_API_KEY),
      __VITE_HUME_SECRET_KEY__: JSON.stringify(process.env.VITE_HUME_SECRET_KEY),
      __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true
      }
    }
  }
});