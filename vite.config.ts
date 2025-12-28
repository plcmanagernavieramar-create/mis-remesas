
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Esto asegura que la app no crashee si intentamos acceder a process.env
    'process.env': JSON.stringify(process.env || {})
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
