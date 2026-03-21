import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/proxy/auth': {
        target: 'https://auth-production-47a8.up.railway.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/auth/, ''),
        secure: true,
      },
      '/proxy/admin': {
        target: 'https://admin-production-8d2a.up.railway.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/admin/, ''),
        secure: true,
      },
    },
  },
});
