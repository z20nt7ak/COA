import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = {
    '/api/labs': { target: env.LABS_TARGET || 'http://localhost:8080/labs', changeOrigin: true, rewrite: (path: string) => path.replace(/^\/api\/labs/, '') },
    '/api/bars': { target: env.BARS_TARGET || 'http://localhost:8081/bars', changeOrigin: true, rewrite: (path: string) => path.replace(/^\/api\/bars/, '') },
  };
  return { plugins: [react()], server: { proxy }, preview: { proxy } };
});
