import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/CSE108Lab08/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://jb404.pythonanywhere.com/',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
