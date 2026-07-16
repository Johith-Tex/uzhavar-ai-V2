import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // No proxy needed — Groq API is called directly from the browser
    // (CORS is allowed from all origins on Groq's API)
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
